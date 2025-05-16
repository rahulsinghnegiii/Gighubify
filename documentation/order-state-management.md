# Order State Management System

## Overview

The Order State Management System provides a structured workflow for orders in the Gighubify marketplace. It defines the possible states an order can be in, which actors can transition between states, and the validation rules for state transitions.

## Order States

Orders in Gighubify can exist in one of these states:

| State | Description |
|-------|-------------|
| `PENDING` | Initial state when order is created but not yet paid |
| `IN_PROGRESS` | Order is paid, and the seller is working on it |
| `DELIVERED` | Seller has submitted the work, awaiting buyer review |
| `REVISION_REQUESTED` | Buyer has requested changes to the delivered work |
| `ACCEPTED` | Buyer has accepted the delivery, completing the transaction |
| `COMPLETED` | Payment has been released to the seller |
| `CANCELLED` | Order has been terminated (may result in refund) |
| `DISPUTED` | Order has an active dispute that needs resolution |

## Actors

The system recognizes these actors who can interact with orders:

| Actor | Description |
|-------|-------------|
| `BUYER` | The customer who placed the order |
| `SELLER` | The service provider fulfilling the order |
| `ADMIN` | Platform administrators who can manage disputes and issues |
| `SYSTEM` | Automated processes (e.g., payment processing) |

## State Transitions

Not all state transitions are valid, and different actors have different permissions:

### From PENDING
- To IN_PROGRESS: SYSTEM (after payment)
- To CANCELLED: BUYER, SELLER, ADMIN

### From IN_PROGRESS
- To DELIVERED: SELLER
- To CANCELLED: BUYER, SELLER, ADMIN
- To DISPUTED: BUYER, SELLER

### From DELIVERED
- To REVISION_REQUESTED: BUYER
- To ACCEPTED: BUYER
- To CANCELLED: ADMIN
- To DISPUTED: BUYER, SELLER

### From REVISION_REQUESTED
- To DELIVERED: SELLER
- To CANCELLED: ADMIN
- To DISPUTED: BUYER, SELLER

### From ACCEPTED
- To COMPLETED: SYSTEM, ADMIN
- To DISPUTED: BUYER, SELLER

### From COMPLETED
- To DISPUTED: BUYER, SELLER, ADMIN

### From CANCELLED
- No further transitions (terminal state)

### From DISPUTED
- To COMPLETED: ADMIN
- To CANCELLED: ADMIN

## State History

Every order maintains a complete history of state changes, including:
- The status that was set
- Timestamp of the change
- Actor ID who made the change
- Optional notes about why the change was made

This history provides an audit trail for both users and administrators.

## Implementation Details

The Order State Management System is implemented across several files:

1. **order-state.util.ts**: Contains the OrderStatus enum, Actor enum, transition rules, and validation functions.

2. **order.model.ts**: Defines the Order interface with fields for status, timestamps, and status history.

3. **order.service.ts**: Provides methods for interacting with orders, including state transition methods with validation.

## Key Features

### Validated State Transitions

Before allowing a state change, the system validates:
- Whether the transition is valid for the current state
- Whether the requesting actor has permission to make the transition

This validation happens in the `isValidTransition` function.

### Available Actions

The system can compute available actions for any user by:
- Determining their role (buyer, seller, admin) in relation to the order
- Finding all valid next states based on the current order state and their role

This is provided by the `getAvailableOrderActions` function.

### Timestamps

The system records timestamps for key events:
- When an order is paid
- When work is delivered
- When revisions are requested
- When work is accepted
- When an order is completed
- When an order is cancelled
- When a dispute is opened

### Status History

A complete history of all status changes is maintained in the `statusHistory` array, with each entry containing:
- The status that was set
- When it was set
- Who set it
- Optional notes explaining the change

## Integrating with Escrow

This Order State Management System forms the foundation for the Escrow System, which will:
- Hold buyer payments in escrow when an order is in progress
- Release funds to the seller when an order is completed
- Handle refunds if an order is cancelled
- Facilitate dispute resolution with admin intervention

## UI Components

The UI provides appropriate controls based on the current order state and the user's role:
- Sellers can deliver work when an order is in progress
- Buyers can accept deliveries or request revisions
- Either party can open disputes in appropriate circumstances
- The order detail page shows the complete timeline of an order 