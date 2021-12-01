import { Sequelize } from 'sequelize';
import sequelizeData from 'sequelize';

export default (sequelize: Sequelize) => {
    
    sequelize.define('category_children_child', {
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
        categoryChildId: {
            type: sequelizeData.UUID,
            allowNull: false,
        }
    },
    {
        indexes: [
            {
                unique: true,
                fields: ['categoryId', 'categoryChildId']
            }
        ]
    });
};