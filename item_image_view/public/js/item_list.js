console.log("ITEM LIST JS LOADED");

frappe.listview_settings["Item"] = {

    add_fields: ["image"],

    formatters: {

        image(value) {

            if (!value) return "";

            return `
                <img
                    src="${value}"
                    style="
                        width:120px;
                        height:120px;
                        object-fit:contain;
                        border-radius:6px;
                        border:1px solid #eee;
                        background:white;
                        padding:3px;
                    "
                >
            `;
        }

    }

};