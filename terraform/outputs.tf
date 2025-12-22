output "resource_group_name" {
  description = "The name of the resource group"
  value       = azurerm_resource_group.rg.name
}

output "storage_account_name" {
  description = "The name of the storage account"
  value       = azurerm_storage_account.storage.name
}

output "container_name" {
  description = "The name of the storage container"
  value       = azurerm_storage_container.container.name
}

output "key_vault_name" {
  description = "The name of the Key Vault"
  value       = azurerm_key_vault.kv.name
}

output "app_url" {
  description = "The public FQDN of the application"
  value       = "http://${azurerm_container_group.app.fqdn}:3000"
}

output "aci_principal_id" {
  description = "The Principal ID of the ACI Managed Identity"
  value       = azurerm_container_group.app.identity[0].principal_id
}