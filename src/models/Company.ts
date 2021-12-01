import { Sequelize, DataTypes } from 'sequelize';
import sequelizeData from 'sequelize';

export default (sequelize: Sequelize) => {
    
    sequelize.define('company', {
        id: {
            type: sequelizeData.UUID,
            defaultValue: sequelizeData.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        business_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ruc: {
            type: DataTypes.STRING,
            allowNull: false
        },
        brand: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
};