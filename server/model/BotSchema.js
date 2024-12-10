const mongoose = require('mongoose');

const BotSchema = new mongoose.Schema({
    language: { type: String, required: true },
    sentence: { type: String, required: true },
    intent: { type: String, required: true },
});

module.exports = mongoose.model('BotData', BotSchema);
