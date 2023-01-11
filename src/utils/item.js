function getCustomItem(item) {
  if (!item || !item.attributes) return null;

  const customItem = {
    id: item.id,
    ...item.attributes,
  };

  customItem.tier = { ...customItem.tier.data.attributes };
  customItem.type = { ...customItem.type.data.attributes };

  return customItem;
}

module.exports = { getCustomItem };
