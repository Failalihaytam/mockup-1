const cds = require('@sap/cds');

module.exports = class AdminService extends cds.ApplicationService {

  async init() {
    const { Users, Projects, Tickets } = this.entities;

    // -----------------------------------------------------------------------
    // Auto-generate ID for any entity if the client doesn't provide one
    // -----------------------------------------------------------------------
    this.before('CREATE', '*', (req) => {
      if (!req.data.id) {
        req.data.id = cds.utils.uuid();
      }
    });

    // -----------------------------------------------------------------------
    // Login action — validate email + password, return user (without password)
    // -----------------------------------------------------------------------
    this.on('login', async (req) => {
      const { email, password } = req.data;
      if (!email || !password) return req.error(400, 'Email and password are required');

      // Read from the DB entity (includes password column)
      const { Users: DbUsers } = cds.entities('cap.perf');
      const [user] = await cds.read(DbUsers).where({ email }).limit(1);
      if (!user) return req.error(401, 'Invalid email or password');
      if (user.password !== password) return req.error(401, 'Invalid email or password');
      if (!user.active) return req.error(403, 'Account is deactivated');

      // Strip password before returning
      delete user.password;
      return user;
    });

    // Auto-set updatedAt on ticket updates
    this.before('UPDATE', Tickets, (req) => {
      req.data.updatedAt = new Date().toISOString();
    });

    // Validate user email format
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
