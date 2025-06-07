# CoreTables

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/suwahas/core-tables)
[![core.js](https://img.shields.io/badge/dependency-core.js-brightgreen.svg)](https://github.com/suwahas/core-js)

> A powerful, lightweight, and fast server-side datatable plugin for the [core.js](https://github.com/suwahas/core-js) library.

CoreTables is built to handle large datasets with ease by delegating all heavy lifting—sorting, searching, and pagination—to the server. It's designed to be minimal, highly configurable, and integrate seamlessly into any project that uses `core.js`.

## Features

*   **Server-Side Processing:** Efficiently handles millions of rows by only loading the data currently visible to the user.
*   **Lightweight & Fast:** Built on the dependency-free `core.js`, ensuring minimal footprint and maximum performance.
*   **Fully AJAX Driven:** All data, sorting, searching, and pagination actions are handled via asynchronous requests.
*   **Fully Configurable:** Easily change all CSS class names to match your project's styling or CSS framework (like Bootstrap, Bulma, etc.).
*   **Dynamic Columns:** Define your table's columns via a separate AJAX call for ultimate flexibility.
*   **Simple, jQuery-like API:** If you know `core.js`, you already know how to use CoreTables.

## Getting Started

### 1. Prerequisites

You must include the `core.js` library before including `core-tables.js`.

*   [**core.js Library**](https://github.com/suwahas/core-js)

### 2. Installation

Download both files and include them in your project.

```html
<!-- Core.js MUST be included first -->
<script src="path/to/core.js"></script>
<!-- Then include the CoreTables plugin -->
<script src="path/to/core-tables.js"></script>
```

### 3. Basic HTML Setup

Create a simple `<div>` element that will contain your table. The plugin will build all the necessary HTML inside this container.

```html
<div id="my-table-container"></div>
```

### 4. CSS for Sorting Indicators (Recommended)

For a better user experience, add the following CSS to your stylesheet. It provides visual feedback for which column is being sorted.

```css
/* Make sortable headers look clickable */
.core-table-container th.sortable {
    cursor: pointer;
    position: relative;
    padding-right: 20px; /* Make space for arrows */
}

/* Style for the up/down sort arrows */
.core-table-container th.sortable::after,
.core-table-container th.sortable::before {
    position: absolute;
    right: 8px;
    font-size: 0.8em;
    opacity: 0.2;
    line-height: 1;
}

.core-table-container th.sortable::before {
    content: '▲';
    top: 0.6em;
}

.core-table-container th.sortable::after {
    content: '▼';
    bottom: 0.6em;
}

/* Style for the currently active sort direction */
.core-table-container th.sorting-asc::before {
    opacity: 1;
}

.core-table-container th.sorting-desc::after {
    opacity: 1;
}

/* Style for disabled pagination buttons */
.core-table-paging button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

### 5. JavaScript Initialization

Initialize the plugin on your container element inside a `J.ready()` call.

```javascript
J.ready(function() {
  J('#my-table-container').coreTable({
    ajax: {
      url: '/api/v1/users' // Your server-side endpoint
    },
    pageLength: 5,
    columns: [
      { data: 'id', title: '#', orderable: false },
      { data: 'first_name', title: 'First Name' },
      { data: 'last_name', title: 'Last Name' },
      { data: 'email', title: 'Email Address' }
    ]
  });
});
```

## Configuration Options

You can customize the plugin's behavior by passing an options object during initialization.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `ajax` | `object` | `{...}` | AJAX configuration. |
| `ajax.url` | `string` | `''` | **Required.** The URL to fetch table data from. |
| `ajax.method` | `string` | `'GET'` | The HTTP method to use for the data request. |
| `ajax.columnsUrl` | `string` | `null` | Optional URL to fetch column definitions dynamically. |
| `columns` | `array` | `[]` | An array of objects defining the table columns. |
| `columns[].data` | `string` | `''` | The key from the server's data object for this column. |
| `columns[].title`| `string` | `''` | The text to display in the table header (`<th>`). |
| `columns[].orderable`|`boolean`| `true` | Set to `false` to disable sorting on this column. |
| `paging` | `boolean` | `true` | Enables or disables pagination controls. |
| `searching` | `boolean` | `true` | Enables or disables the search input box. |
| `ordering` | `boolean` | `true` | Enables or disables sorting on all columns. |
| `pageLength` | `number` | `10` | The default number of rows to display per page. |
| `classNames` | `object` | `{...}` | An object containing all CSS classes used by the plugin. See [Advanced Examples](#advanced-examples) for customization. |

## Server-Side Contract

For CoreTables to function correctly, your backend API **must** adhere to the following request and response format.

### Request Parameters

Your server will receive the following parameters in the query string (for GET) or request body.

| Parameter | Type | Description |
| --- | --- | --- |
| `draw` | `number` | A timestamp sent by CoreTables. Return this value unmodified in your response. |
| `start` | `number` | The starting record index for pagination (e.g., 0, 10, 20). |
| `length` | `number` | The number of records to return (the page size). |
| `search[value]` | `string` | The value from the search input box. Empty if no search. |
| `order[0][column]` | `number` | The index of the column being sorted. |
| `order[0][dir]` | `string` | The sort direction: `'asc'` or `'desc'`. |
| `columns[i][data]`| `string` | The `data` property for each column. |

### Response Format

Your server **must** return a JSON object with the following structure:

```json
{
  "draw": 1677695392218,
  "recordsTotal": 570,
  "recordsFiltered": 125,
  "data": [
    {
      "id": 101,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.d@example.com"
    },
    {
      "id": 102,
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane.s@example.com"
    }
  ]
}
```
*   `draw`: The `draw` value from the request.
*   `recordsTotal`: The total number of records in the database *before* any filtering.
*   `recordsFiltered`: The total number of records *after* applying the search filter.
*   `data`: An array of objects, where each object represents one row.

## Advanced Examples

### Example 1: Customizing Class Names (Bootstrap 5)

CoreTables allows you to override all default class names to seamlessly integrate with a CSS framework like Bootstrap.

```javascript
J('#my-bootstrap-table').coreTable({
  ajax: { url: '/api/v1/products' },
  columns: [
    { data: 'sku', title: 'SKU' },
    { data: 'name', title: 'Product Name' },
    { data: 'stock', title: 'Stock Level' }
  ],
  classNames: {
    container: 'p-3',
    search: 'mb-3',
    tableWrapper: 'table-responsive',
    table: 'table table-striped table-hover',
    footer: 'd-flex justify-content-between align-items-center mt-3',
    info: 'text-muted small',
    paging: 'btn-group',
    paginateBtn: 'btn btn-outline-secondary',
    disabled: 'disabled'
  }
});
```

### Example 2: Loading Columns Dynamically

You can define your columns on the server and have CoreTables fetch them automatically.

**JavaScript Initialization:**
```javascript
J('#dynamic-cols-table').coreTable({
  ajax: {
    url: '/api/v1/audits/data', // URL for table data
    columnsUrl: '/api/v1/audits/columns' // URL for column definitions
  }
});
```

**Server Response from `/api/v1/audits/columns`:**
Your server should return a JSON array of column definition objects.

```json
[
  { "data": "id", "title": "Log ID", "orderable": false },
  { "data": "user_email", "title": "User" },
  { "data": "action", "title": "Action Performed" },
  { "data": "timestamp", "title": "Date" }
]
```

## License

This project is licensed under the MIT License.
