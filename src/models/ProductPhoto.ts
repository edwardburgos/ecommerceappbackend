import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    
    sequelize.define('product_photo', {
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        }
    });
};