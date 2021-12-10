import { DataTypes, Sequelize } from 'sequelize';
import sequelizeData from 'sequelize';

export default (sequelize: Sequelize) => {
    
    sequelize.define('category_child', {
        id: {
            type: sequelizeData.UUID,
            defaultValue: sequelizeData.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        categoryId: {
            type: sequelizeData.UUID,
            allowNull: false,
        },
        CategoryChildId: {
            type: sequelizeData.UUID,
            allowNull: false
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },
    {
        indexes: [
            {
                unique: true,
                fields: ['categoryId', 'CategoryChildId']
            }
        ]
    });
};