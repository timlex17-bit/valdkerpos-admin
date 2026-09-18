/**
 * Which kinds of item a shop can create.
 *
 * The backend accepts all four kinds for every shop and falls back to
 * "product" when the field is absent (`ProductSerializer.validate` in
 * pos/serializers.py), so this is the dashboard's own judgement about what is
 * worth asking rather than a rule it invented about permissions: a workshop
 * sells services and spare parts, a restaurant sells menu items, and a retail
 * shop sells products - and one option is not a question worth putting on a
 * form.
 */

export type ItemType = 'product' | 'menu' | 'service' | 'sparepart'

/** What the backend will accept, in backend order (Product.ItemType). */
export const ALL_ITEM_TYPES: ItemType[] = ['product', 'menu', 'service', 'sparepart']

export function itemTypesForBusiness(businessType?: string | null): ItemType[] {
  const value = String(businessType || '').trim().toUpperCase()

  if (value === 'WORKSHOP') return ['service', 'sparepart', 'product']
  if (value === 'RESTAURANT') return ['menu', 'product']
  return ['product']
}

/**
 * Whether to show the choice at all. A retail shop is not asked, unless the
 * product in hand already is something else - an item created before the shop
 * changed its business type, say. Hiding the field then would quietly turn a
 * service into a product on the next save.
 */
export function showsItemTypeChoice(businessType?: string | null, currentType?: string | null) {
  const options = itemTypesForBusiness(businessType)
  if (options.length > 1) return true

  const current = String(currentType || '').trim().toLowerCase()
  return Boolean(current) && !options.includes(current as ItemType)
}
