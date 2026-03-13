let start = 0;
let page_length = 48;
let loading = false;
let finished = false;
let search_timer;

frappe.pages['item-catalog'].on_page_load = function(wrapper) {

    frappe.require("/assets/item_image_view/css/catalog.css");

    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Item Catalog',
        single_column: true
    });

$(page.body).html(`

<div class="catalog-layout">

    <div class="catalog-sidebar">

        <h4>Filters</h4>

        <input type="text" id="catalog-search"
            placeholder="Search item..."
            class="form-control">

        <div class="filter-section">

            <label>Item Group</label>
            <select id="catalog-group" class="form-control">
                <option value="">All Groups</option>
            </select>

        </div>

        <div class="filter-section">

            <label>Brand</label>
            <select id="catalog-brand" class="form-control">
                <option value="">All Brands</option>
            </select>

        </div>

        <div class="filter-section">

            <label>Stock</label>

            <select id="catalog-stock" class="form-control">
                <option value="">All</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
            </select>

        </div>

    </div>


    <div class="catalog-content">

        <div id="catalog-items">
            <div class="catalog-grid"></div>
        </div>

    </div>

</div>

`);

    load_filter_data();
    load_items(page);

};


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

    if (loading || finished) return;

    loading = true;

    $("#catalog-items").append(`<div id="catalog-loading">Loading...</div>`);

    let filters = {

        search: ($("#catalog-search").val() || "").trim(),
        item_group: $("#catalog-group").val(),
        brand: $("#catalog-brand").val(),
        stock: $("#catalog-stock").val(),
        start: start,
        page_length: page_length

    };

    frappe.call({
        method: "item_image_view.utils.item_catalog.get_items",
        args: filters,

        callback(r){

            $("#catalog-loading").remove();

            let items = r.message || [];

            if(items.length < page_length){
                finished = true;
            }

            render_items(page, items);

            start += page_length;
            loading = false;

        }
    });

}


function render_items(page, items){

    if(start === 0){
        $(".catalog-grid").html("");
    }

    let html = "";

    if(items.length === 0 && start === 0){
        $(".catalog-grid").html(`<p style="padding:40px;text-align:center;">No items found</p>`);
        return;
    }

    items.forEach(item => {

        let image = item.image || "/assets/frappe/images/fallback-thumbnail.jpg";
        let price = format_currency(item.custom_selling_price || 0);
        let qty = item.custom_available_quantity || 0;

        let stock_color = "#e74c3c";
        let stock_text = "Out of Stock";

        if(qty > 10){
            stock_color = "#27ae60";
            stock_text = "In Stock";
        } 
        else if(qty > 0){
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

    $(".catalog-grid").append(html);

}


function reset_and_reload(){

    start = 0;
    finished = false;
    loading = false;

    $(".catalog-grid").html("");

    load_items(cur_page.page);

}


$(document).on("keyup","#catalog-search",function(){

    clearTimeout(search_timer);

    search_timer = setTimeout(() => {

        reset_and_reload();

    },300);

});


$(document).on("change","#catalog-group", reset_and_reload);
$(document).on("change","#catalog-brand", reset_and_reload);



$(window).on("scroll", function(){

    if(loading || finished) return;

    let scrollTop = $(window).scrollTop();
    let windowHeight = $(window).height();
    let documentHeight = $(document).height();

    if(scrollTop + windowHeight >= documentHeight - 200){

        load_items(cur_page.page);

    }

});

$(document).on("change","#catalog-stock", reset_and_reload);