const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    subCategoryTitle: {
        type: String,
        trim: true,
        required: true,
        default: function() {
            return `${this.name} Services`;
        }
    },
    icon: {
        type: String,
        required: true,
        get: function(icon) {
            if (icon && icon.includes('/')) {
                return icon.split('/').pop();
            }
            return icon;
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true,
    collection: 'servicecategories', 
    toJSON: {
        getters: true,
        transform: function(doc, ret) {
            if (ret.icon && ret.icon.includes('/')) {
                ret.icon = ret.icon.split('/').pop();
            }
            return ret;
        }
    }
});

// Pre-save middleware to ensure subCategoryTitle is set
serviceCategorySchema.pre('save', function(next) {
    if (!this.subCategoryTitle) {
        this.subCategoryTitle = `${this.name} Services`;
    }
    next();
});

const ServiceCategory = mongoose.model('ServiceCategory', serviceCategorySchema);

module.exports = ServiceCategory;
