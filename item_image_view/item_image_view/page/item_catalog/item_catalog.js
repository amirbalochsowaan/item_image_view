frappe.pages['item-catalog'].on_page_load = function(wrapper) {
	frappe.require("/assets/item_image_view/css/catalog.css");
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Item Catalog',
        single_column: true
    });
    $(page.body).html(`
        <div class="catalog-filters">

            <input type="text" id="catalog-search"
                placeholder="Search item..."
                class="form-control">

            <select id="catalog-group" class="form-control">
                <option value="">All Groups</option>
            </select>

            <select id="catalog-brand" class="form-control">
                <option value="">All Brands</option>
            </select>

        </div>

        <div id="catalog-items"></div>
    `);

    load_filter_data();
    load_items(page);
}

function load_filter_data(){

    frappe.call({
        method: "frappe.client.get_list",
        args:{
            doctype:"Item Group",
            fields:["name"],
            limit_page_length:500
        },
        callback(r){

            r.message.forEach(g => {

                $("#catalog-group").append(
                    `<option value="${g.name}">${g.name}</option>`
                );

            });

        }
    });

    frappe.call({
        method:"frappe.client.get_list",
        args:{
            doctype:"Brand",
            fields:["name"],
            limit_page_length:500
        },
        callback(r){

            r.message.forEach(b => {

                $("#catalog-brand").append(
                    `<option value="${b.name}">${b.name}</option>`
                );

            });

        }
    });

}



function load_items(page){

    let filters = {

        search: $("#catalog-search").val(),
        item_group: $("#catalog-group").val(),
        brand: $("#catalog-brand").val()

    };

    frappe.call({
        method: "item_image_view.utils.item_catalog.get_items",
        args: filters,

        callback(r){

            render_items(page, r.message);

        }
    });

}


function render_items(page, items){

    let html = `<div class="catalog-grid">`;

    items.forEach(item => {

        let image = item.image || "/assets/frappe/images/fallback-thumbnail.jpg";

        let price = format_currency(item.custom_selling_price || 0);
        let qty = item.custom_available_qty || 0;

        let stock_color = "#e74c3c";
        let stock_text = "Out of Stock";

        if(qty > 10){
            stock_color = "#27ae60";
            stock_text = "In Stock";
        } else if(qty > 0){
            stock_color = "#f39c12";
            stock_text = "Low Stock";
        }

html += `

<div class="catalog-card"
     onclick="frappe.set_route('Form','Item','${item.name}')">

    <div class="catalog-image">
        <img src="${image}">
    </div>

<div class="catalog-body">

    <div class="catalog-title">
        ${item.item_name}
    </div>


    <div class="catalog-brand">
        ${item.brand || ""}
    </div>

    <div class="catalog-price">
        ${price}
    </div>

    <div class="catalog-stock"
         style="background:${stock_color}">
        ${stock_text} (${qty})
    </div>

</div>

</div>
`;
    });

    html += `</div>`;

    $("#catalog-items").html(html);
}


$(document).on("keyup","#catalog-search",function(){

    load_items(cur_page.page);

});

$(document).on("change","#catalog-group",function(){

    load_items(cur_page.page);

});

$(document).on("change","#catalog-brand",function(){

    load_items(cur_page.page);

});