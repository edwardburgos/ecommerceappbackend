import { sequelizeObject } from "./db";
import { gql } from 'apollo-server';
import { ProductType, ReturnedSlideType } from "./extras/types";
import { ApolloServer } from "apollo-server";
import sequelize from 'sequelize'
import dataLoad from "./extras/dataLoad";

const { conn } = sequelizeObject;
const { product, category, photo, slide, company } = sequelizeObject.models;

(async function databaseConfiguration() {
  try {
    await conn.sync({ force: true })

    if (!((await product.findAll()).length)) {
      await dataLoad();
    }

    // GraphQL configuration

    // GraphQL types definition
    const typeDefs = gql`
      type Category {
        name: String!
        id: ID!
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
          return {id: companyFound[0].getDataValue('id'), business_name: companyFound[0].getDataValue('business_name'), 
          ruc: companyFound[0].getDataValue('ruc'), brand: companyFound[0].getDataValue('brand'),
          logo: photoURL ? photoURL.getDataValue('url') : null}
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