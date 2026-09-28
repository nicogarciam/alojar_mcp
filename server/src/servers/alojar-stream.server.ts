import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// --- Availability ---
import { registerCheckAvailabilityTool } from '../tools/alojar/check-availability.tool.js';
import { registerShowAccommodationDetailTool } from '../tools/alojar/show-accommodation-detail.tool.js';

// --- Bookings ---
import { registerManageBookingTool } from '../tools/alojar/manage-booking.tool.js';

// --- Prices ---
import { registerListAccommodationPricesTool } from '../tools/alojar/list-accommodation-prices.tool.js';
import { registerPriceGridTool } from '../tools/alojar/price-grid.tool.js';
import { registerCreateAccommodationPriceTool } from '../tools/alojar/create-accommodation-price.tool.js';
import { registerUpdateAccommodationPriceTool } from '../tools/alojar/update-accommodation-price.tool.js';
import { registerDeleteAccommodationPriceTool } from '../tools/alojar/delete-accommodation-price.tool.js';

// --- Customers ---
import { registerSearchCustomersTool } from '../tools/alojar/search-customers.tool.js';
import { registerCreateCustomerTool } from '../tools/alojar/create-customer.tool.js';

/**
 * Creates and configures the Alojar MCP server with all business tools.
 *
 * Tool groups:
 *  - Availability : check_availability, show_accommodation_detail
 *  - Bookings     : create_booking, list_bookings, get_booking, update_booking, cancel_booking
 *  - Prices       : list_accommodation_prices, price_grid, create/update/delete_accommodation_price
 *  - Customers    : search_customers, create_customer
 */
export const getServer = () => {
    const server = new McpServer(
        {
            name: 'alojar-streamable-http-server',
            version: '1.0.0',
        },
        { capabilities: { logging: {} } }
    );

    // --- Consulta de Disponibilidad ---
    registerCheckAvailabilityTool(server);
    registerShowAccommodationDetailTool(server);

    // --- Gestión de Reservas ---
    registerManageBookingTool(server);

    // --- Gestión de Precios ---
    registerListAccommodationPricesTool(server);
    registerPriceGridTool(server);
    registerCreateAccommodationPriceTool(server);
    registerUpdateAccommodationPriceTool(server);
    registerDeleteAccommodationPriceTool(server);

    // --- Clientes ---
    registerSearchCustomersTool(server);
    registerCreateCustomerTool(server);

    return server;
};
