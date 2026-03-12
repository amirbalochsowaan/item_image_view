import frappe

def safe_execute(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            f"Item Aggregation Error ({fn.__name__}) args={args}"
        )


def item_price_after_save(doc, method=None):

    if not doc.selling:
        return

    safe_execute(update_item_price, doc.item_code)


def update_item_qty(item_code):

    qty = frappe.db.sql("""
        SELECT IFNULL(SUM(actual_qty),0)
        FROM `tabBin`
        WHERE item_code = %s
    """, item_code)[0][0]

    current = frappe.db.get_value("Item", item_code, "custom_available_quantity")

    if current != qty:

        frappe.db.set_value(
            "Item",
            item_code,
            "custom_available_quantity",
            qty,
            update_modified=False
        )


def update_item_price(item_code):

    price = frappe.db.get_value(
        "Item Price",
        {
            "item_code": item_code,
            "selling": 1
        },
        "price_list_rate",
        order_by="modified desc", 
    )

    current = frappe.db.get_value("Item", item_code, "custom_selling_price")

    if current != (price or 0):

        frappe.db.set_value(
            "Item",
            item_code,
            "custom_selling_price",
            price or 0,
            update_modified=False
        )

def sle_after_insert(doc, method=None):
    safe_execute(update_item_qty, doc.item_code)


def daily_item_sync():

    try:

        qty_map = frappe.db.sql("""
            SELECT item_code, SUM(actual_qty) as qty
            FROM `tabBin`
            GROUP BY item_code
        """, as_dict=True)

        price_map = frappe.db.sql("""
            SELECT item_code, MAX(price_list_rate) as price
            FROM `tabItem Price`
            WHERE selling = 1
            GROUP BY item_code
        """, as_dict=True)

        price_lookup = {p.item_code: p.price for p in price_map}

        for row in qty_map:

            frappe.db.set_value(
                "Item",
                row.item_code,
                {
                    "custom_available_quantity": row.qty or 0,
                    "custom_selling_price": price_lookup.get(row.item_code, 0),
                },
                update_modified=False
            )

    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            "Daily Item Sync Failed"
        )