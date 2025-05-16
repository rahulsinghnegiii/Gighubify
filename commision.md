I'd like you to analyze the current codebase and help implement the following core features, checking which ones are already implemented and adding the ones that aren't:

💰 Platform Fee System:
Platform Fee Deduction: Both buyer and seller are charged a 10% fee from the total order amount.

Buyer pays: Total + 10% platform fee

Seller receives: 90% of total amount

Escrow System:

Once the buyer places an order, the full amount (including the fee) should be held in the platform's account.

The amount should only be released to the seller once the buyer accepts the delivery.

Add proper order states: Pending, In Progress, Delivered, Accepted, Completed, Cancelled.

🎥 Seller Promotion Feature:
Promotional Video Upload:

Give sellers an option to upload a short promotional video to showcase their services.

This video should be shown on their gig/service page.

🛠 Task:
✅ Check if any of these features are already partially or fully implemented.

⚙️ Implement any missing logic in the backend and frontend.

🧪 Add test cases, or minimal testing hooks where necessary, especially for:

Payment handling

Escrow logic

Order status transitions

Promotional video upload and rendering