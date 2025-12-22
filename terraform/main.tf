resource "azurerm_virtual_network" "vnet" {
  name                = var.azurerm_virtual_network
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "time_sleep" "wait_for_rg" {
  depends_on = [azurerm_resource_group.rg]
  create_duration = "10s"
}

resource "azurerm_key_vault_secret" "example_secret" {
  name         = "StorageAccountKey"
  value        = azurerm_storage_account.storage.primary_access_key
  key_vault_id = azurerm_key_vault.kv.id

  depends_on = [azurerm_key_vault.kv]
}