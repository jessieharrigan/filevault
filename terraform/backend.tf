terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "tfstatejessie1766145197"
    container_name       = "tfstate"
    key                  = "filevault.terraform.tfstate"
  }
}