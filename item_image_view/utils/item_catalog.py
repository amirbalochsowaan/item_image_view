import frappe

@frappe.whitelist()
def get_items(search=None, item_group=None, brand=None):

    filters = {
        "disabled": 0
    }

    if item_group:
        filters["item_group"] = item_group

    if brand:
        filters["brand"] = brand


    items = frappe.get_all(

        "Item",

        fields=[
            "name",
            "item_name",
            "image",
            "brand",
            "item_group",
            "custom_selling_price",
            "custom_available_quantity"
        ],

        filters=filters,

        limit_page_length=200

    )

    if search:

        search = search.lower()

        items = [
            i for i in items
            if search in (i.item_name or "").lower()
            or search in (i.name or "").lower()
        ]

    return items