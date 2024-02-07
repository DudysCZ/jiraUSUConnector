'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'interfaces', 'Name', 
      { type: Sequelize.STRING });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(
      'interfaces', // name of Source model
      'Name' // key we want to remove
    );
  }
};
