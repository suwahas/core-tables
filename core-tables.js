/**
 * CoreTables Plugin
 * A powerful, server-side datatable plugin for the core.js (J) library.
 * It handles AJAX-driven data, sorting, searching, and pagination with configurable class names.
 * This version is optimized to use core.js's internal fragment caching for efficient rendering.
 *
 * @version 2.1.0
 * @plugin-name coreTable
 * @author https://github.com/suwahas
 * @requires core.js
 * @license MIT
 */
(function(J) {
  'use strict';

  if (!J) {
    console.error('CoreTables requires core.js (J) to be loaded first.');
    return;
  }

  // --- PRIVATE HELPER FUNCTIONS ---

  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  function initializeTable(container, options) {
    if (options.ajax.columnsUrl) {
      J.ajax({ url: options.ajax.columnsUrl, method: 'GET' })
        .then(columns => {
          options.columns = columns;
          setupTableDOM(container, options);
          fetchData(container, options);
        })
        .catch(err => {
          container.html(`<div class="${options.classNames.error}">Error: Could not load column definitions.</div>`);
          console.error('CoreTables Error:', err);
        });
    } else if (options.columns && options.columns.length > 0) {
      setupTableDOM(container, options);
      fetchData(container, options);
    } else {
      container.html(`<div class="${options.classNames.error}">Error: No columns defined.</div>`);
    }
  }

  function setupTableDOM(container, options) {
    const cn = options.classNames;
    container.empty().addClass(cn.container);

    const searchControl = J(`<div><input type="text" placeholder="Search..."/></div>`).addClass(cn.search);
    if (!options.searching) searchControl.css('display', 'none');

    const tableWrapper = J('<div>').addClass(cn.tableWrapper);
    const table = J('<table>').addClass(cn.table).appendTo(tableWrapper);
    const thead = J('<thead>').appendTo(table);
    J('<tbody>').appendTo(table); // Append empty tbody

    const headerRow = J('<tr>').appendTo(thead);
    options.columns.forEach((col, index) => {
      const th = J('<th>').text(col.title).data('columnIndex', index);
      if (options.ordering && col.orderable !== false) {
        th.addClass(cn.sortable);
      }
      th.appendTo(headerRow);
    });

    const footer = J('<div>').addClass(cn.footer);
    const info = J('<span>').addClass(cn.info);
    const pagingControl = J('<div>').addClass(cn.paging);
    if (!options.paging) pagingControl.css('display', 'none');

    footer.append(info).append(pagingControl);
    container.append(searchControl).append(tableWrapper).append(footer);
    wireUpEventListeners(container, options);
  }
  
  function wireUpEventListeners(container, options) {
    const cn = options.classNames;

    if (options.ordering) {
      container.on('click', `th.${cn.sortable}`, function() {
        const columnIndex = parseInt(J(this).data('columnIndex'));
        const state = JSON.parse(container.data('coreTableState'));
        if (state.sort.columnIndex === columnIndex) {
          state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          state.sort.columnIndex = columnIndex;
          state.sort.direction = 'asc';
        }
        container.data('coreTableState', JSON.stringify(state));
        fetchData(container, options);
      });
    }

    if (options.searching) {
      const debouncedSearch = debounce(function() {
        const state = JSON.parse(container.data('coreTableState'));
        state.searchTerm = this.value;
        state.currentPage = 0;
        container.data('coreTableState', JSON.stringify(state));
        fetchData(container, options);
      }, 400);
      container.on('keyup', `.${cn.search} input`, debouncedSearch);
    }

    if (options.paging) {
      container.on('click', `.${cn.paginateBtn}`, function() {
        const button = J(this);
        if (button.hasClass(cn.disabled)) return;
        const state = JSON.parse(container.data('coreTableState'));
        if (button.data('page') === 'next') state.currentPage++;
        else if (button.data('page') === 'previous') state.currentPage--;
        container.data('coreTableState', JSON.stringify(state));
        fetchData(container, options);
      });
    }
  }

  function fetchData(container, options) {
    const cn = options.classNames;
    const state = JSON.parse(container.data('coreTableState'));
    const tbody = container.find('tbody');
    
    tbody.html(`<tr><td colspan="${options.columns.length}">Loading...</td></tr>`);
    
    const requestData = {
      draw: Date.now(),
      start: state.currentPage * state.pageLength,
      length: state.pageLength,
      'search[value]': state.searchTerm,
      'order[0][column]': state.sort.columnIndex,
      'order[0][dir]': state.sort.direction,
    };
    
    options.columns.forEach((col, index) => {
      requestData[`columns[${index}][data]`] = col.data;
    });

    J.ajax({
      url: options.ajax.url,
      method: options.ajax.method || 'GET',
      data: requestData
    })
    .then(response => {
      renderTableBody(container, options, response.data);
      if (options.paging) renderPagingControls(container, options, state, response);
      if (options.ordering) renderHeaderSortUI(container, options, state);
    })
    .catch(err => {
      tbody.html(`<tr><td colspan="${options.columns.length}" class="${cn.error}">Error loading data.</td></tr>`);
      console.error("CoreTables AJAX Error:", err);
    });
  }

  /**
   * Renders the table body efficiently by creating an array of row elements in memory
   * and appending them to the DOM in a single operation, leveraging core.js's
   * internal DocumentFragment handling.
   */
  function renderTableBody(container, options, data) {
    const tbody = container.find('tbody');
    tbody.empty();

    if (data.length === 0) {
      tbody.html(`<tr><td colspan="${options.columns.length}">No matching records found</td></tr>`);
      return;
    }

    // 1. Use .map() to create an array of raw <tr> DOM elements in memory.
    const rows = data.map(rowObject => {
      const tr = J('<tr>');
      options.columns.forEach(column => {
        const cellData = rowObject[column.data] || '';
        // Create TD and append it to the TR. core.js handles the fragment caching internally for this.
        tr.append(J('<td>').html(cellData));
      });
      return tr[0]; // Return the raw DOM element for the array.
    });

    // 2. Pass the entire array of <tr> elements to tbody.append().
    // Your core.js library will efficiently turn this array into a DocumentFragment
    // and append all rows in a single DOM manipulation.
    tbody.append(rows);
  }

  function renderPagingControls(container, options, state, response) {
    const cn = options.classNames;
    const { recordsFiltered } = response;
    const startRecord = recordsFiltered === 0 ? 0 : (state.currentPage * state.pageLength + 1);
    const endRecord = Math.min(startRecord + state.pageLength - 1, recordsFiltered);

    container.find(`.${cn.info}`).text(`Showing ${startRecord} to ${endRecord} of ${recordsFiltered} entries`);
    
    const pagingContainer = container.find(`.${cn.paging}`);
    pagingContainer.empty();

    const prevButton = J('<button>').addClass(cn.paginateBtn).data('page', 'previous').text('Previous');
    const nextButton = J('<button>').addClass(cn.paginateBtn).data('page', 'next').text('Next');

    if (state.currentPage === 0) prevButton.addClass(cn.disabled);
    if (endRecord >= recordsFiltered) nextButton.addClass(cn.disabled);
    
    pagingContainer.append(prevButton).append(nextButton);
  }

  function renderHeaderSortUI(container, options, state) {
    const cn = options.classNames;
    container.find(`th.${cn.sortable}`).each(function() {
      const th = J(this);
      th.removeClass(`${cn.sortingAsc} ${cn.sortingDesc}`);
      if (parseInt(th.data('columnIndex')) === state.sort.columnIndex) {
        th.addClass(state.sort.direction === 'asc' ? cn.sortingAsc : cn.sortingDesc);
      }
    });
  }

  // --- MAIN PLUGIN DEFINITION ---

  J.fn.coreTable = function(userOptions = {}) {
    const defaults = {
      ajax: { url: '', method: 'GET', columnsUrl: null },
      columns: [],
      paging: true,
      searching: true,
      ordering: true,
      pageLength: 10,
      classNames: {
        container: 'core-table-container',
        search: 'core-table-search',
        tableWrapper: 'core-table-wrapper',
        table: 'core-table',
        footer: 'core-table-footer',
        info: 'core-table-info',
        paging: 'core-table-paging',
        paginateBtn: 'paginate-btn',
        disabled: 'disabled',
        sortable: 'sortable',
        sortingAsc: 'sorting-asc',
        sortingDesc: 'sorting-desc',
        error: 'core-table-error'
      }
    };

    const options = Object.assign({}, defaults, userOptions);
    options.ajax = Object.assign({}, defaults.ajax, userOptions.ajax);
    options.classNames = Object.assign({}, defaults.classNames, userOptions.classNames);
    
    return this.each(function() {
      const container = J(this);
      if (container.data('coreTableState')) return;

      const state = {
        currentPage: 0,
        pageLength: options.pageLength,
        searchTerm: '',
        sort: { columnIndex: options.columns.findIndex(c => c.orderable !== false), direction: 'asc' }
      };
      if (state.sort.columnIndex === -1) state.sort.columnIndex = 0; // fallback

      container.data('coreTableState', JSON.stringify(state));
      initializeTable(container, options);
    });
  };

}(window.J));
