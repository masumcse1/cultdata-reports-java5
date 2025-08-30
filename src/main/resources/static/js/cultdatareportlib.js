// cultdatareportlib.js
window.CultDataReportLib = (function() {
    // Helper function to check if a date is valid
    function isValidDate(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }

    async function fetchDistributionManagers() {
        try {
            const response = await fetch('/odp/api/distribution-managers?onlyMapped=true');

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            const distributionManagers = data.map(dm => ({  id: dm.id,
                                                            name: `${dm.name} (${dm.id})`})).sort((a, b) => a.name.localeCompare(b.name));

            return distributionManagers;
        } catch (error) {
            console.error('Error fetching distribution managers:', error);
            throw new Error('Failed to load distribution managers');
        }
    }

    function formatEuropeanCurrency(amount) {
        return amount?.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) || '0,00';
    }

    return {
        fetchDistributionManagers,
        formatEuropeanCurrency
    };
})();