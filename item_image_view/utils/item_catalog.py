import frappe

@frappe.whitelist()
def get_items(search=None, item_group=None, brand=None, stock=None, start=0, page_length=48):

    start = int(start)
    page_length = int(page_length)

    conditions = ["i.disabled = 0"]
    params = {}

    if item_group:
        conditions.append("i.item_group = %(item_group)s")
        params["item_group"] = item_group

    if brand:
        conditions.append("i.brand = %(brand)s")
        params["brand"] = brand

    if search:
        conditions.append("(i.item_name LIKE %(search)s OR i.name LIKE %(search)s)")
        params["search"] = f"%{search}%"

    if stock == "in":
        conditions.append("i.custom_available_quantity > 10")

    elif stock == "low":
        conditions.append("i.custom_available_quantity BETWEEN 1 AND 10")

    elif stock == "out":
        conditions.append("i.custom_available_quantity = 0")

    where_clause = " AND ".join(conditions)

    items = frappe.db.sql(f"""
        SELECT
            i.name,
            i.item_name,
            i.image,
            i.brand,
            i.item_group,
            i.custom_selling_price,
            i.custom_available_quantity,
            IFNULL(po.ordered_qty, 0) AS ordered_qty

        FROM `tabItem` i

        LEFT JOIN (
            SELECT
                poi.item_code,
                SUM(poi.qty - poi.received_qty) AS ordered_qty
            FROM `tabPurchase Order Item` poi
            INNER JOIN `tabPurchase Order` po
                ON po.name = poi.parent
            WHERE 
                po.docstatus = 1
                AND poi.qty > poi.received_qty
            GROUP BY poi.item_code
        ) po ON po.item_code = i.name

        WHERE {where_clause}
        ORDER BY i.item_name
        LIMIT {start}, {page_length}
    """, params, as_dict=True)

    return items