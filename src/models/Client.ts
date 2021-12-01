import { Sequelize, DataTypes } from 'sequelize';
import sequelizeData from 'sequelize';

export default (sequelize: Sequelize) => {
    
    sequelize.define('client', {
        id: {
            type: sequelizeData.UUID,
            defaultValue: sequelizeData.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        firstName: {
            type: DataTypes.STRING
        },
        lastName: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        hash: {
            type: DataTypes.STRING
        },
        salt: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.ENUM("Native", "Google", "Unregistered"),
            allowNull: false,
        },
        verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        profilepic: {
            type: DataTypes.STRING
        },
        address: {
            type: DataTypes.STRING
        },
        addressType: {
            type: DataTypes.STRING
        },
        postalCode: {
            type: DataTypes.INTEGER
        },
        birthday: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });
};