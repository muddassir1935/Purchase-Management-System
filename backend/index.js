const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config();

// Initialize our tools
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware (Setup)
app.use(cors()); // Allows our frontend (running on a different port) to talk to this backend
app.use(express.json()); // Tells Express to parse incoming JSON data into JavaScript objects

// ==========================================
// MONTHLY CLEANUP — Runs on server startup
// ==========================================
async function cleanupOldRecords() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await prisma.purchaseItem.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        status: 'BOUGHT' // Only auto-delete bought items older than 30 days
      }
    });

    if (deleted.count > 0) {
      console.log(`🧹 Auto-cleanup: Removed ${deleted.count} records older than 30 days.`);
    }
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
}

// ==========================================
// ROUTES: Authentication
// ==========================================

// Route: Verify Admin PIN
app.post('/api/auth/verify', (req, res) => {
  const { pin } = req.body;
  const adminPin = process.env.ADMIN_PIN || '1234';

  if (String(pin) === String(adminPin)) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

// ==========================================
// ROUTES: People
// ==========================================

// Route 1: Get all People (with their calculated total balance)
app.get('/api/people', async (req, res) => {
  try {
    // Tell Prisma to fetch all people, AND include all their associated items
    const people = await prisma.person.findMany({
      include: { items: true }
    });

    // Calculate the overall balance for each person before sending it back
    const peopleWithBalances = people.map(person => {
      let totalGiven = 0;
      let totalSpent = 0;

      // Loop through all items this person requested
      for (const item of person.items) {
        totalGiven += item.moneyGiven;
        
        // Only subtract from the balance if the item was actually bought
        if (item.status === 'BOUGHT' && item.actualPrice !== null) {
          totalSpent += item.actualPrice;
        }
      }

      // Balance = Money Given upfront - Actual Money Spent
      // If Balance > 0: Uncle has change left over (Uncle owes them).
      // If Balance < 0: The items cost more than given (They owe Uncle).
      const currentBalance = totalGiven - totalSpent;

      return {
        id: person.id,
        name: person.name,
        currentBalance: currentBalance
      };
    });

    res.json(peopleWithBalances); // Send the calculated data to the frontend
  } catch (error) {
    console.error('GET /api/people error:', error.message);
    res.status(500).json({ error: "Failed to fetch people" });
  }
});

// Route 2: Add a new Person
app.post('/api/people', async (req, res) => {
  try {
    const { name } = req.body;
    
    const newPerson = await prisma.person.create({
      data: { name: name }
    });
    
    res.json(newPerson);
  } catch (error) {
    console.error('POST /api/people error:', error.message);
    res.status(500).json({ error: "Failed to create person" });
  }
});

// Route 3: Delete a Person (cascade deletes their items too)
app.delete('/api/people/:id', async (req, res) => {
  try {
    const personId = parseInt(req.params.id);

    await prisma.person.delete({
      where: { id: personId }
    });

    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/people error:', error.message);
    res.status(500).json({ error: "Failed to delete person" });
  }
});

// ==========================================
// ROUTES: Purchase Items
// ==========================================

// Route 4: Get all Purchase Items
app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.purchaseItem.findMany({
      include: { person: true },
      orderBy: [
        { status: 'asc' },    // PENDING items first (alphabetically before 'BOUGHT')
        { createdAt: 'desc' }  // Newest first within each status group
      ]
    });
    res.json(items);
  } catch (error) {
    console.error('GET /api/items error:', error.message);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Route 5: Add a new Purchase Item
app.post('/api/items', async (req, res) => {
  try {
    const { itemName, quantity, personId, moneyGiven } = req.body;
    
    const newItem = await prisma.purchaseItem.create({
      data: {
        itemName: itemName,
        quantity: quantity,
        personId: parseInt(personId),
        moneyGiven: parseFloat(moneyGiven)
      },
      include: { person: true }
    });
    res.json(newItem);
  } catch (error) {
    console.error('POST /api/items error:', error.message);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// Route 6: Mark Item as Bought (Update Actual Price)
app.put('/api/items/:id/buy', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { actualPrice } = req.body;

    const updatedItem = await prisma.purchaseItem.update({
      where: { id: itemId },
      data: {
        actualPrice: parseFloat(actualPrice),
        status: 'BOUGHT'
      },
      include: { person: true }
    });
    
    res.json(updatedItem);
  } catch (error) {
    console.error('PUT /api/items/:id/buy error:', error.message);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Route 7: Delete a Purchase Item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);

    await prisma.purchaseItem.delete({
      where: { id: itemId }
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/items error:', error.message);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Route 8: Manual cleanup trigger
app.post('/api/cleanup', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await prisma.purchaseItem.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        status: 'BOUGHT'
      }
    });

    res.json({ message: `Cleaned up ${deleted.count} old records.` });
  } catch (error) {
    console.error('POST /api/cleanup error:', error.message);
    res.status(500).json({ error: "Cleanup failed" });
  }
});

// ==========================================
// SERVE STATIC FRONTEND (For Production)
// ==========================================
// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// The "catchall" handler: for any request that doesn't
// match an API route above, send back React's index.html file.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Turn on the server!
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  cleanupOldRecords(); // Run cleanup on every server start
});
