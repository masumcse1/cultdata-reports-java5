/**
 * MultiSelect Dropdown Component
 * Reusable for any dataset (with optional "All" option).
 * Returns a function to get selected values.
 * Author: Gulam Samdani (refactored for production use)
 */
window.MultiSelectLib = (function() {

    function initMultiSelect({ data, containerId}) {

         const container = document.getElementById(containerId);

          container.innerHTML = `
            <div class="dropdown w-100 mb-3">
              <button class="btn btn-light border dropdown-toggle d-flex justify-content-between align-items-center w-100 text-start"
                      type="button" data-bs-toggle="dropdown" aria-expanded="false">
                Select options
              </button>
              <div class="dropdown-menu w-100 p-2 overflow-auto" style="max-height: 200px;">
                <div id="${containerId}_list">
                  <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" value="all" id="selectAll">
                    <label class="fw-bold" for="selectAll">${data.find(d => d.isAll)?.label || "Select All"}</label>
                  </div>
                  <hr class="my-2">
                  ${data.filter(d => !d.isAll).map(d => `
                    <div class="form-check mb-2">
                      <input class="form-check-input multi-checkbox" type="checkbox" value="${d.value}" id="${d.value}">
                      <label for="${d.value}">${d.label}</label>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `;

        const dropdownBtn = container.querySelector('button');
        const checkboxes = container.querySelectorAll('.multi-checkbox');
        const selectAll = document.getElementById('selectAll');
        const optionMap = new Map(data.map(d => [d.value, d.label]));
        const values = data.filter(d => !d.isAll).map(d => d.value);

        // Update dropdown button text
        function updateButtonText() {
            const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
            if (selected.length === 0) dropdownBtn.textContent = "Select options";
            else if (selected.length === checkboxes.length) dropdownBtn.textContent = optionMap.get("all") || "All Selected";
            else if (selected.length === 1) dropdownBtn.textContent = optionMap.get(selected[0]);
            else dropdownBtn.textContent = `${selected.length} selected`;
        }

        // Handle "Select All"
        selectAll.addEventListener('change', function() {
            checkboxes.forEach(cb => cb.checked = this.checked);
            updateButtonText();
        });

        // Handle individual checkbox changes
        checkboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
                selectAll.checked = allChecked;
                selectAll.indeterminate = anyChecked && !allChecked;
                updateButtonText();
            });
        });

        // Prevent dropdown from closing on label/checkbox click
        container.querySelectorAll('.form-check-input, label').forEach(el => {
            el.addEventListener('click', e => e.stopPropagation());
        });

        // Close dropdown on outside click
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
                const dropdown = bootstrap.Dropdown.getInstance(dropdownBtn);
                if (dropdown) dropdown.hide();
            }
        });

       // Initialize with "All" selected
       selectAll.checked = true;
       checkboxes.forEach(cb => cb.checked = true);

        // Initialize button text
        updateButtonText();

        // Return a function to get selected values
        return () => Array.from(checkboxes)
                         .filter(cb => cb.checked)
                         .map(cb => optionMap.get(cb.value));
    }

    return {
        initMultiSelect
    };
})();