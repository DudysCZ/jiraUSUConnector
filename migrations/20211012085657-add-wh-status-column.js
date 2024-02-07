'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'webhooks', 'Status', 
      { type: Sequelize.STRING });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(
      'webhooks', // name of Source model
      'Status' // key we want to remove
    );
  }
};
