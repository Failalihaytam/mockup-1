const cds = require('@sap/cds');

module.exports = class AdminService extends cds.ApplicationService {

  async init() {
    // AdminService provides full CRUD out of the box via CDS projections.
    // Add any admin-specific event handlers here.

    const { Users, Projects, Tickets } = this.entities;

    // Example: Auto-set updatedAt on ticket updates
    this.before('UPDATE', Tickets, (req) => {
      req.data.updatedAt = new Date().toISOString();
    });

    // Example: Validate user email format
    this.before(['CREATE', 'UPDATE'], Users, (req) => {
      if (req.data.email && !req.data.email.includes('@')) {
        return req.error(400, 'Invalid email format');
      }
    });

    // Example: Prevent deleting active projects
    this.before('DELETE', Projects, async (req) => {
      const project = await cds.tx(req).read(Projects).where({ id: req.data.id });
      if (project.length && project[0].status === 'ACTIVE') {
        return req.error(409, 'Cannot delete an active project. Change status first.');
      }
    });

    await super.init();
  }
};
