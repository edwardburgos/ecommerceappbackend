import { sequelizeObject } from "./db";
import { gql } from 'apollo-server';
import { ProductType, ReturnedSlideType } from "./extras/types";
import { ApolloServer } from "apollo-server";
import sequelize, { Model } from 'sequelize'
import dataLoad from "./extras/dataLoad";

const { conn } = sequelizeObject;
const { product, category, photo, slide, company, category_child, category_children_child } = sequelizeObject.models;

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
      }
      type SecondLevelCategory {
        id: ID!
        name: String!
        showInNav: Boolean!
        level: String!
        categories: [Category]
      }
      type FirstLevelCategory {
        id: ID!
        name: String!
        showInNav: Boolean!
        level: String!
        categories: [SecondLevelCategory]
      }
      type Product {
        name: String!
        id: ID!
        categoryId: String!
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
        findProductsByName(name: String!): [Product]
        allSlides: [Slide]
        getCompany: Company
        getMenu: [FirstLevelCategory]
      }
    `
    // GraphQL resolvers
    const resolvers = {
      Query: {
        productCount: async () => await product.count(),
        categoriesCount: async () => await category.count(),
        photosCount: async () => await photo.count(),
        findProductsByName: async (root: ProductType, args: { name: string }) => await product.findAll({
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
          const firstLevelCategories = await category.findAll({ where: { level: '1' } })
          const firstLevelCategoriesIds = firstLevelCategories.map(e => e.getDataValue('id'))

          // First second level relationships
          const firstSecondLevelCategories = await Promise.all(firstLevelCategoriesIds.map(e => {
            return new Promise<{ id: string, categoryId: string, CategoryChildId: string }[] | null>(async (resolve, reject) => {
              try {
                const firstSecondLevelCategories = await category_child.findAll({ where: { categoryId: e } })
                resolve(firstSecondLevelCategories.length ? firstSecondLevelCategories.map(e => {
                  const id = e.getDataValue('id');
                  const categoryId = e.getDataValue('categoryId');
                  const CategoryChildId = e.getDataValue('CategoryChildId');
                  return { id, categoryId, CategoryChildId }
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
                const relationshipsFound = await category_children_child.findAll({ where: { categoryChildId: e } })
                resolve(relationshipsFound.length ? relationshipsFound.map(e => { return { categoryId: e.getDataValue('categoryId'), categoryChildId: e.getDataValue('categoryChildId') } }) : null)
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
                  id: secondCategoryInfo!.getDataValue('id'),
                  name: secondCategoryInfo!.getDataValue('name'),
                  showInNav: secondCategoryInfo!.getDataValue('showInNav'),
                  level: secondCategoryInfo!.getDataValue('level'),
                  categories: thirdCategories.map(id => {
                    return thirdLevelCategoriesFound.filter(e => e && (e.getDataValue('id') === id))[0]
                  }).map(e => {
                    return {
                      id: e!.getDataValue('id'),
                      name: e!.getDataValue('name'),
                      showInNav: e!.getDataValue('showInNav'),
                      level: e!.getDataValue('level'),
                    }
                  })
                }
              })
            }
          })
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