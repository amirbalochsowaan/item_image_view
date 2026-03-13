import frappe

@frappe.whitelist()
def get_items(search=None, item_group=None, brand=None, stock=None, start=0, page_length=48):

    start = int(start)
    page_length = int(page_length)

    conditions = ["disabled = 0"]
    params = {}

    if item_group:
        conditions.append("item_group = %(item_group)s")
        params["item_group"] = item_group

    if brand:
        conditions.append("brand = %(brand)s")
        params["brand"] = brand

    if search:
        conditions.append("(item_name LIKE %(search)s OR name LIKE %(search)s)")
        params["search"] = f"%{search}%"

    if stock == "in":
        conditions.append("custom_available_quantity > 10")

    elif stock == "low":
        conditions.append("custom_available_quantity BETWEEN 1 AND 10")

    elif stock == "out":
        conditions.append("custom_available_quantity = 0")

    where_clause = " AND ".join(conditions)

    items = frappe.db.sql(f"""
        SELECT
            name,
            item_name,
            image,
            brand,
            item_group,
            custom_selling_price,
            custom_available_quantity
        FROM `tabItem`
        WHERE {where_clause}
        ORDER BY item_name
        LIMIT {start}, {page_length}
    """, params, as_dict=True)

    return items