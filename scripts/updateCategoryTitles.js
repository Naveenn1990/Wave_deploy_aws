const mongoose = require('mongoose');
const ServiceCategory = require('../models/ServiceCategory');
require('dotenv').config();

async function updateCategoryTitles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const categories = await ServiceCategory.find({
            $or: [
                { subCategoryTitle: null },
                { subCategoryTitle: { $exists: false } }
            ]
        });

        console.log(`Found ${categories.length} categories to update`);

        for (const category of categories) {
            category.subCategoryTitle = `${category.name} Services`;
            await category.save();
            console.log(`Updated category: ${category.name}`);
        }

        console.log('All categories updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating categories:', error);
        process.exit(1);
    }
}

updateCategoryTitles();
