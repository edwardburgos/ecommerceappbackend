import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';

// Get the environment variables
dotenv.config();

// Connect to the database
const sequelize = new Sequelize(process.env.DATABASE_URL || "postgres://root:root@localhost/ecommerceapp",
  {
    logging: false,
    native: false,
    dialect: 'postgres',
    protocol: 'postgres'
  }
);

// CONFIGURATION OF THE MODELS

// Reading the models
const basename = path.basename(__filename);

const modelDefiners: ((conn: Sequelize) => {})[] = [];

fs.readdirSync(path.join(__dirname, '/models'))
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.ts'))
  .forEach((file) => {
    modelDefiners.push(require(path.join(__dirname, '/models', file)).default);
  });

// Injecting the sequelize connection to all models
modelDefiners.forEach((model) => model(sequelize));

// Destructuring of sequelize.models
const { category, client, country, photo, product, review, slide, state, category_child, company } = sequelize.models;

// Definition of model relationships
product.belongsToMany(category, { as: 'CategoryMember', through: 'category_product' })
category.belongsToMany(category, { as: 'CategoryChild', through: 'category_child' })
photo.belongsToMany(product, { as: 'ProductPhoto', through: 'product_photo' })
category.belongsToMany(category_child, { as: 'CategoryChildrenChild', through: 'category_children_child' })
photo.hasOne(slide, { foreignKey: { allowNull: false } });
photo.hasOne(category);
photo.hasOne(company);
country.hasOne(client);
state.hasOne(client);
country.hasMany(state, { foreignKey: { allowNull: false } });
state.belongsTo(country);
client.hasMany(review, { foreignKey: { allowNull: false } });
review.belongsTo(client);

export const sequelizeObject = {
  models: { ...sequelize.models },
  conn: sequelize,
};