import { Sequelize, DataTypes } from 'sequelize';
import sequelizeData from 'sequelize';

export default (sequelize: Sequelize) => {
    
    sequelize.define('product', {
        id: {
            type: sequelizeData.UUID,
            defaultValue: sequelizeData.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT
        },
        price: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false
        },
        stars: {
            type: DataTypes.DECIMAL
        }
    });
};