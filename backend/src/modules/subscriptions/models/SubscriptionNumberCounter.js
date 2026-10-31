import mongoose from "mongoose";

const subscriptionNumberCounterSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  },
  sequence: {
    type: Number,
    default: 0
  }
});

export default mongoose.model("SubscriptionNumberCounter", subscriptionNumberCounterSchema);
