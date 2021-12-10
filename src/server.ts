import { sequelizeObject } from "./db";
import { gql } from 'apollo-server';
import { ReturnedSlideType, QueryResult } from "./extras/types";
import { ApolloServer } from "apollo-server";
import sequelize, { Model } from 'sequelize'
import dataLoad from "./extras/dataLoad";
import { Op } from "sequelize";

const { conn } = sequelizeObject;
const { product, category, photo, slide, company, category_child, category_children_child, category_product, product_photo } = sequelizeObject.models;

(async function databaseConfiguration() {
  try {
    await conn.sync({ force: false })

    if (!((await product.findAll()).length)) {
      await dataLoad();
    }

    // GraphQL configuration

    // GraphQL types definition
    const typeDefs = gql`
      type Category {
        id: ID!
        name: String!
        showInNav: Boolean!
        level: String!
        url: String!
      }
      type SecondLevelCategory {
        id: ID!
        categoryId: ID!
        name: String!
        showInNav: Boolean!
        level: String!
        url: String!
        categories: [Category]
      }
      type FirstLevelCategory {
        id: ID!
        name: String!
        showInNav: Boolean!
        level: String!
        url: String!
        categories: [SecondLevelCategory]
      }
      type ProductSimple {
        id: ID!
        photo: String!
        name: String!
        price: Float!
        currency: String!
        url: String!
      }
      type ProductComplete {
        id: ID!
        photos: [String!]
        name: String!
        description: String
        price: Float!
        currency: String!
        stars: Float
        url: String!
      }
      type Photo {
        url: String!
        categoryId: ID
        productId: ID
      }
      type Slide {
        id: ID!
        name: String!
        position: Int!
        photo: String!
      }
      type Company {
        id: ID!
        business_name: String!
        ruc: String!
        brand: String!
        logo: String
      }
      type Query {
        productCount: Int!
        categoriesCount: Int!
        photosCount: Int!
        findProductsByName(name: String!): [ProductSimple]
        allSlides: [Slide]
        getCompany: Company
        getMenu: [FirstLevelCategory]
        getCategoriesProducts(urls: [String!]): [ProductSimple]
        getProduct(url: String!): ProductComplete
      }
    `
    // GraphQL resolvers
    const resolvers = {
      Query: {
        productCount: async () => await product.count(),
        categoriesCount: async () => await category.count(),
        photosCount: async () => await photo.count(),
        findProductsByName: async (parent: undefined, args: { name: string }) => await product.findAll({
          where: {
            name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', '%' + args.name.toLowerCase() + '%')
          }
        }),
        allSlides: async () => {
          const slides = await slide.findAll()
          let newSlides: ReturnedSlideType[] = [];
          for (const e of slides) {
            const photoURL = await photo.findOne({ where: { id: e.getDataValue('photoId') } })
            newSlides.push({ id: e.getDataValue('id'), name: e.getDataValue('name'), position: e.getDataValue('position'), photo: photoURL ? photoURL.getDataValue('url') : null });
          };
          return newSlides;
        },
        getCompany: async () => {
          const companyFound = await company.findAll();
          const photoURL = await photo.findOne({ where: { id: companyFound[0].getDataValue('photoId') } })
          return {
            id: companyFound[0].getDataValue('id'), business_name: companyFound[0].getDataValue('business_name'),
            ruc: companyFound[0].getDataValue('ruc'), brand: companyFound[0].getDataValue('brand'),
            logo: photoURL ? photoURL.getDataValue('url') : null
          }
        },
        getMenu: async () => {
          // First level categories
          const firstLevelCategories = await category.findAll({
            where: { level: '1' }, order: [
              ['order', 'ASC']
            ]
          })
          const firstLevelCategoriesIds = firstLevelCategories.map(e => e.getDataValue('id'))

          // First second level relationships
          const firstSecondLevelCategories = await Promise.all(firstLevelCategoriesIds.map(e => {
            return new Promise<{ id: string, categoryId: string, CategoryChildId: string }[] | null>(async (resolve, reject) => {
              try {
                const firstSecondLevelCategories = await category_child.findAll({
                  where: { categoryId: e }, order: [
                    ['order', 'ASC']
                  ]
                })
                resolve(firstSecondLevelCategories.length ? firstSecondLevelCategories.map(e => {
                  const id = e.getDataValue('id');
                  const categoryId = e.getDataValue('categoryId');
                  const CategoryChildId = e.getDataValue('CategoryChildId');
                  const order = e.getDataValue('order')
                  return { id, categoryId, CategoryChildId, order }
                }) : null)
              } catch (e) {
                reject(e)
              }
            })
          }))

          // First second level relationships & second level categories
          const firstSecondLevelCategoriesIds: string[] = []
          const secondLevelCategoriesIds: string[] = []
          firstSecondLevelCategories.forEach(e => {
            if (e) {
              e.forEach(el => {
                firstSecondLevelCategoriesIds.push(el.id)
                secondLevelCategoriesIds.push(el.CategoryChildId)
              })
            }
          })
          const secondLevelCategoriesFound = await Promise.all(secondLevelCategoriesIds.map(e => {
            return new Promise<Model<any, any> | null>(async (resolve, reject) => {
              try {
                const category_found = await category.findOne({ where: { id: e } })
                resolve(category_found)
              } catch (e) {
                reject(e)
              }
            })
          }))

          // First second level relationships & third level categories
          const firstSecondRelationshipsAndThirdLevelCategory = await Promise.all(firstSecondLevelCategoriesIds.map(e => {
            return new Promise<{ categoryId: string, categoryChildId: string }[] | null>(async (resolve, reject) => {
              try {
                const relationshipsFound = await category_children_child.findAll({
                  where: { categoryChildId: e }, order: [
                    ['order', 'ASC']
                  ]
                })
                resolve(relationshipsFound.length ? relationshipsFound.map(e => { return { categoryId: e.getDataValue('categoryId'), categoryChildId: e.getDataValue('categoryChildId'), order: e.getDataValue('order') } }) : null)
              } catch (error) {
                reject(error)
              }
            })
          }))

          // Third level categories
          const thirdLevelCategoryIds: string[] = []
          firstSecondRelationshipsAndThirdLevelCategory.map(e => {
            if (e) {
              e.forEach(e => thirdLevelCategoryIds.push(e.categoryId))
            }
          })
          const thirdLevelCategoriesFound = await Promise.all(thirdLevelCategoryIds.map(e => {
            return new Promise<Model<any, any> | null>(async (resolve, reject) => {
              try {
                const categoryFound = await category.findOne({ where: { id: e } })
                resolve(categoryFound)
              } catch (error) {
                reject(error)
              }
            })
          }))

          // Returned object
          return firstLevelCategories.map(e => {
            return {
              id: e.getDataValue('id'),
              name: e.getDataValue('name'),
              showInNav: e.getDataValue('showInNav'),
              level: e.getDataValue('level'),
              url: e.getDataValue('url'),
              categories: firstSecondLevelCategories.filter(el => el && (el[0].categoryId === e.getDataValue('id')))[0]?.map(e => {
                const secondCategoryInfo = secondLevelCategoriesFound.filter(el => el && (el.getDataValue('id') === e.CategoryChildId))[0]
                const firstSecondRelationShipId = e.id
                const thirdCategories: string[] = []
                firstSecondRelationshipsAndThirdLevelCategory.forEach(e => {
                  if (e) {
                    e.forEach(e => {
                      if (e.categoryChildId === firstSecondRelationShipId) thirdCategories.push(e.categoryId)
                    })
                  }
                })
                return {
                  id: firstSecondRelationShipId,
                  categoryId: secondCategoryInfo!.getDataValue('id'),
                  name: secondCategoryInfo!.getDataValue('name'),
                  showInNav: secondCategoryInfo!.getDataValue('showInNav'),
                  level: secondCategoryInfo!.getDataValue('level'),
                  url: secondCategoryInfo!.getDataValue('url'),
                  categories: thirdCategories.map(id => {
                    return thirdLevelCategoriesFound.filter(e => e && (e.getDataValue('id') === id))[0]
                  }).map(e => {
                    return {
                      id: e!.getDataValue('id'),
                      name: e!.getDataValue('name'),
                      showInNav: e!.getDataValue('showInNav'),
                      level: e!.getDataValue('level'),
                      url: e!.getDataValue('url')
                    }
                  })
                }
              })
            }
          })
        },
        getCategoriesProducts: async (parent: undefined, args: { urls: string[] }) => {
          try {
            const categoriesFound = await category.findAll({ where: { url: args.urls } })
            const categoriesFoundIds = categoriesFound.map(e => e.getDataValue('id'))
            const results = await conn.query(`SELECT * FROM "products" AS "product" WHERE
            (SELECT COUNT(*) FROM category_products WHERE category_products."productId" = product.id) >= ${categoriesFoundIds.length} AND
            (SELECT COUNT(*) FROM category_products WHERE category_products."productId" = product.id AND 
            (${categoriesFoundIds.map((e, index) => index ? ` OR category_products."categoryId" = '${e}'` : `category_products."categoryId" = '${e}'`).join(' ')})) >= ${categoriesFoundIds.length}
            LIMIT 20;`, {
              model: product,
            })
            const photos = await Promise.all(results.map(e => {
              return new Promise(async (resolve, reject) => {
                try {
                  const photoFound = await product_photo.findOne({
                    where: {
                      [Op.and]: [
                        { productId: e.getDataValue('id') },
                        { order: 0 }
                      ]
                    }
                  })
                  const photoURL = await photo.findOne({
                    where: { id: photoFound?.getDataValue('photoId') }
                  })
                  resolve(photoURL?.getDataValue('url'))
                } catch (e) {
                  reject(e)
                }
              })
            }))
            return results.map((e, index) => {
              return {
                id: e.getDataValue('id'),
                name: e.getDataValue('name'),
                photo: photos[index],
                url: e.getDataValue('url'),
                price: e.getDataValue('price'),
                currency: e.getDataValue('currency')
              }
            })
          } catch (e) {
            console.log(e)
          }
        },
        getProduct: async (parent: undefined, args: { url: string }) => {
          try {
            const productFound = await product.findOne({ where: { url: args.url } })
            const photosIds = await product_photo.findAll({
              where: { productId: productFound?.getDataValue('id') }, order: [
                ['order', 'ASC']
              ]
            })
            const photosURLs = await Promise.all(photosIds.map(e => { 
              return new Promise(async (resolve, reject) => {
                try {
                  const photoFound = await photo.findOne({ where: {id: e.getDataValue('photoId')}})
                  resolve(photoFound!.getDataValue('url'))
                } catch(e) {
                  reject(e)
                }
              })
            }))
            return productFound ? {
              id: productFound.getDataValue('id'),
              name: productFound.getDataValue('name'),
              url: productFound.getDataValue('url'),
              photos: photosURLs,
              description: productFound.getDataValue('description'),
              price: productFound.getDataValue('price'),
              currency: productFound.getDataValue('currency'),
              stars: productFound.getDataValue('stars')
            } : null
          } catch (e) {
            console.log(e)
          }
        }
      }
    }

    // GraphQL server
    const server = new ApolloServer({
      typeDefs,
      resolvers
    })

    // Server execution
    const conection = await server.listen();
    console.log(`Server listening at ${conection.url}`)

  } catch (e) {
    console.log(e)
  }
})()