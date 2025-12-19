output "resource_group_id" {
  value = azurerm_resource_group.rg.id
}

output "storage_account_name" {
  description = "The name of the storage account"
  value       = azurerm_storage_account.storage.name
}

output "storage_account_key" {
  description = "The primary access key for the storage account"
  value       = azurerm_storage_account.storage.primary_access_key
  sensitive   = true
}

output "container_name" {
  description = "The name of the storage container"
  value       = azurerm_storage_container.container.name
}

output "connection_string" {
  description = "The connection string for the storage account"
  value       = azurerm_storage_account.storage.primary_connection_string
  sensitive   = true
}

output "app_url" {
  value = "http://${azurerm_container_group.app.fqdn}:3000"
}