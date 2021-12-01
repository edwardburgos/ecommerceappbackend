import { Sequelize, DataTypes } from 'sequelize';
import sequelizeData from 'sequelize';

export default (sequelize: Sequelize) => {
    
    sequelize.define('review', {
        id: {
            type: sequelizeData.UUID,
            defaultValue: sequelizeData.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        description: {
            type: DataTypes.TEXT
        },
        stars: {
            type: DataTypes.INTEGER,
            validate: {
                min: 1,
                max: 5
            }
        },
        date: {
            type: DataTypes.DATE
        },
        likes: {
            type: DataTypes.INTEGER
        }
    });
};