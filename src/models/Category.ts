import { Sequelize, DataTypes } from 'sequelize';
import sequelizeData from 'sequelize';

export default (sequelize: Sequelize) => {
    
    sequelize.define('category', {
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
        showInNav: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        order: {
            type: DataTypes.INTEGER
        },
        level: {
            type: DataTypes.ENUM('1', '2', '3'),
            allowNull: false,
            defaultValue: '3'
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
};