'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'webhooks', // name of Source model
      'interfaceId', // name of the key we're adding 
      {
        type: Sequelize.INTEGER,
        references: {
          model: 'interfaces', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(
      'webhooks', // name of Source model
      'interfaceId' // key we want to remove
    );
  }
};
