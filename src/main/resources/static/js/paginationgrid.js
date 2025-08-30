/**
 * Pagination Grid Component
 * Author: Gulam Samdani (refactored for production use)
 */
window.PaginationGridLib = (function () {

    function renderGrid({ ctx, columns, url, mapResultsFn, body }) {
        try {
            if (ctx.grid) {
                ctx.grid.destroy();
            }
            ctx.loading = true;

            const gridContainer = document.getElementById('results-grid');
            if (!gridContainer) return;

            ctx.grid = new gridjs.Grid({
                columns: columns,
                server: {
                    url: url,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    then: data => {
                        ctx.loading = false;
                        ctx.paginationLoading = false;
                        ctx.results = data.data || [];
                        ctx.totalRecords = data.totalRecords || 0;
                        ctx.totalPages = data.totalPages || 1;
                        ctx.totalClientIdSum = calculateTotalClientIdSum(data.allData || ctx.results);

                        if (ctx.$nextTick) {
                            ctx.$nextTick(() => updateSummary(ctx));
                        } else {
                            updateSummary(ctx);
                        }

                        return mapResultsFn ? mapResultsFn(ctx.results) : ctx.results;
                    },
                    total: data => data.totalRecords || 0,
                    body: JSON.stringify(body)
                },
                pagination: {
                    enabled: true,
                    limit: ctx.limit,
                    server: {
                        url: (prev, page, limit) => `${prev}?limit=${limit}&page=${page + 1}`
                    }
                },
                search: true,
                sort: true,
                fixedHeader: true
            }).render(gridContainer);

            // Event listeners
            ctx.grid.on('ready', () => updateSummary(ctx));
            ctx.grid.on('pageChanged', () => updateSummary(ctx));
            ctx.grid.on('sort', () => updateSummary(ctx));
            ctx.grid.on('search', () => updateSummary(ctx));

        } catch (error) {
            ctx.loading = false;
            ctx.paginationLoading = false;
            ctx.validationMessage = `Failed to display results: ${error.message}`;
        }
    }

    function updateSummary(ctx) {
        const tbody = document.querySelector(".gridjs-table tbody");
        if (!tbody) return;

        let visibleClientIdSum = 0;
        Array.from(tbody.querySelectorAll("tr")).forEach(row => {
            const clientIdCell = row.children[0]?.textContent.trim();
            const clientId = parseInt(clientIdCell) || 0;
            visibleClientIdSum += clientId;
        });

        const footer = document.getElementById("summary-footer");
        if (footer) {
            footer.innerHTML = `
                <table class="custom-footer">
                    <tbody>
                        <tr class="summary-footer">
                            <td>Client ID Sum (Page / All)</td>
                            <td>${visibleClientIdSum} / ${ctx.totalClientIdSum}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        }
    }

    function calculateTotalClientIdSum(data) {
        return data.reduce((sum, item) => {
            const clientId = parseInt(item.client?.id) || 0;
            return sum + clientId;
        }, 0);
    }

    return {
        renderGrid
    };

})();