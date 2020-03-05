import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { LoaderComponent } from './../loader/loader.component';
import { MainService } from 'src/app/services/main.service';
import { PubSubService } from 'angular7-pubsub';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
@Component({
  selector: '[products]',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  isToggle: any = false;
  isToggleCategory: any = false;
  productsCategory: any = [];
  responsiveProductsCategory: any = [];
  currentResponsiveCats: any = [];
  allResponsiveCats: any = [];
  selectedProductsCategory: any = [];
  searchText: any = '';
  products: any = [];
  selectedCat: any = {};
  showSub: any = true;
  limit: any = 16;
  activeSubCat = 0;
  productName: any;
  displayAllProducts: boolean = false;
  @ViewChild('loaderComponent') loaderComponent: LoaderComponent;
  constructor(
    public mainService: MainService,
    private eventService: PubSubService,
    private cdr: ChangeDetectorRef,
    private cacheService: CacheService
  ) { }

  ngOnInit() {
    this.loadCategory();

    this.eventService.$sub('closeAllProducts', () => {
      if (!this.mainService.isResponsive) {
        this.isToggle = false;
      }
    });

    this.eventService.$sub('getCartData', (data) => {
      this.productName = data.productName;
    });

    this.eventService.$sub('openAllProduct', () => {
      this.cacheService.set("product-tooltip-data", true, { maxAge: 15 * 60 });
      this.isToggleOpen();
    });
  }

  setTooltipFlag(link) {
    link = (this.mainService.isApp === true) ? link + '/isApp/true' : link;
    if (window.location != window.parent.location) {
      window.top.location.href = link;
    } else {
      window.location.href = link;
    }
  }

  async loadCategory() {
    let params = { limit: this.limit, 'productId': this.mainService.productId, 'search': this.searchText }, url = 'productdesigner/catalog/getCategory', cacheKey: string = 'getCategory' + this.mainService.baseUrl + this.mainService.productId;
    await this.mainService.getData(url, params, cacheKey).then(res => {
      if (res.enableAllProducts == 1) {
        this.displayAllProducts = true;
      }
      this.eventService.$pub('DisplayAllProducts', this.displayAllProducts);


      if (res && res.catalogCategory && res.catalogProducts.products) {
        this.productsCategory = res.catalogCategory;
        this.products = res.catalogProducts.products;
        var filterArr = this.productsCategory.filter(data => data.id == res.defaultCatId);
        if (filterArr.length == 0) {
          this.selectedCat = this.productsCategory[0];
        } else {
          this.selectedCat = filterArr[0];
        }
        this.selectedProductsCategory[0] = this.selectedCat;
        this.activeSubCat = this.selectedCat.id;
        if (this.mainService.isResponsive) {
          this.processProductCategory();
        }
      }
    });

  }

  processProductCategory() {
    let sortedArray = this.productsCategory.sort(function (a, b) {
      return a.level - b.level
    })
    for (let category of sortedArray) {
      if (category.parentId) {
        let filtered = this.responsiveProductsCategory.filter(data => data.id == category.parentId);
        if (filtered.length != 0) {
          filtered[0]['subcategory'].push(category);
        } else {
          this.checkForParent(category);
        }
      } else {
        let data = [];
        data['subcategory'] = []
        data['id'] = category.id;
        data['name'] = category.name;
        data['level'] = category.level;
        data['path'] = category.path;
        this.responsiveProductsCategory.push(data);
      }
      this.currentResponsiveCats = this.responsiveProductsCategory.map(a => Object.assign({}, a));
      this.allResponsiveCats[category.id] = this.responsiveProductsCategory.map(a => Object.assign({}, a));
    }
    this.allResponsiveCats[this.selectedCat.id] = this.currentResponsiveCats.map(a => Object.assign({}, a));
  }
  checkForParent(category) {
    for (let cat of this.responsiveProductsCategory) {
      let filtered = cat.subcategory.filter(data => data.id == category.parentId);
      if (filtered.length != 0) {
        this.parseCategory(filtered, cat, category);
      } else {
        if (cat.subcategory.length > 0) {
          for (let subCat of cat.subcategory) {
            if (subCat.subcategory && subCat.subcategory.length > 0) {
              let filtered = subCat.subcategory.filter(data => data.id == category.parentId);
              this.parseCategory(filtered, subCat, category);
            }
          }
        }
      }
    }
  }
  parseCategory(filtered, subCat, category) {
    if (filtered.length != 0) {
      if (!filtered[0]['subcategory']) {
        filtered[0]['subcategory'] = [];
      }
      filtered[0]['subcategory'].push(category);
      let filtered1 = subCat.subcategory.filter(data => data.id == filtered[0].parentId);
      if (filtered1.length != 0) {
        if (!filtered1[0]['subcategory']) {
          filtered1[0]['subcategory'] = [];
        }
        filtered1[0]['subcategory'].push(category);
        let filtered2 = subCat.subcategory.filter(data => data.id == filtered1[0].parentId);
        if (filtered2.length != 0) {
          if (!filtered2[0]['subcategory']) {
            filtered2[0]['subcategory'] = [];
          }
          filtered2[0]['subcategory'].push(category);
        }
      }
    }
  }

  getNumberArray(value: number) {
    value = value - 2;
    var items: number[] = [];
    for (var i = 1; i <= value; i++) {
      items.push(i);
    }
    return items;
  }

  onChangeCategory(selectedCat, searchText, showSub = true) {
    this.selectedCat = selectedCat != null ? selectedCat : this.selectedCat;
    this.products = [];
    this.loaderComponent.showSubLoader = true;
    this.cdr.detectChanges();
    let catId = selectedCat == null ? selectedCat : selectedCat.id;
    let params = { limit: this.limit, 'productId': this.mainService.productId, 'search': searchText, 'categoryId': catId }, url = 'productdesigner/catalog/getProducts', cacheKey: string = 'getProducts' + searchText + catId + this.mainService.baseUrl;
    this.mainService.getData(url, params, cacheKey).then(res => {
      if (res) {
        this.loaderComponent.showSubLoader = false;
        this.products = res.catalogProducts.products;
      }
    });

    /**
     * responsive chnages
     */
    if (showSub) {
      for (let selectedProductCat of this.selectedProductsCategory) {
        selectedProductCat.showSub = false;
      }
      this.selectedCat.showSub = true;
    }
    /**
     * Find sequence
     */
    this.pushCategoryPaths(this.selectedCat)
    this.updateShownCat(this.selectedCat.parentId, this.selectedCat.id);
  }
  pushCategoryPaths(selectedCat) {
    this.selectedProductsCategory = [];
    if (selectedCat.level == 2) {
      this.selectedProductsCategory.push(selectedCat);
      return;
    }
    let paths = selectedCat.path.split("/");

    for (let path of paths) {
      if (path == '1' || path == '2') {
        continue;
      }
      let filter = this.productsCategory.filter(data => data.id == path);
      this.selectedProductsCategory.push(filter[0]);
    }
    this.selectedProductsCategory.push(selectedCat);
  }

  public isToggleOpen() {
    this.isToggle = !this.isToggle;
  }

  //Load more
  loadMoreProducts() {
    this.limit = this.limit + 16;
    this.onChangeCategory(this.selectedCat.id, '');
  }

  //Search Products
  searchProducts($event) {
    let searchTxt = $event.target.value.toString();
    var catId = '';
    if (searchTxt == "") {
      catId = this.selectedCat;
    } else {
      catId = null;
    }
    var self = this;
    setTimeout(function () {
      self.onChangeCategory(catId, searchTxt, false);
    }, 500);
  }
  updateShownCat(parentId, currentId) {
    let filtered = this.currentResponsiveCats.filter(data => data.id == parentId);
    let filtered1: any;
    if (filtered[0] && filtered[0].subcategory) {
      filtered1 = filtered[0].subcategory.filter(data => data.id == currentId);
    }
    if (filtered1 && filtered1[0] && filtered1[0].level == 2) {
      this.allResponsiveCats[currentId] = filtered[0].subcategory.map(a => Object.assign({}, a));
    }
    if (filtered[0] && filtered[0].subcategory) {
      filtered[0].subcategory = filtered1;
      this.currentResponsiveCats = filtered[0].subcategory.map(a => Object.assign({}, a));
      this.activeSubCat = filtered[0].subcategory[0].id;
    }
    if (filtered1 && filtered1[0] && filtered1[0].level != 2) {
      this.allResponsiveCats[currentId] = filtered[0].subcategory.map(a => Object.assign({}, a));
    }
  }
  parseCat(cat) {
    this.activeSubCat = cat.id;
    this.currentResponsiveCats = this.allResponsiveCats[cat.id].map(a => Object.assign({}, a));
    for (let subcat of this.productsCategory) {
      if (cat.id != subcat.id) {
        subcat.showSub = false;
      }
    }
    cat.showSub = !cat.showSub;
  }
  backCategory(cat) {
    let filtered = this.responsiveProductsCategory.filter(data => data.id == cat.parentId);
    if (filtered.length == 0) {
      let filtered1;
      for (let selectedProductCat of this.responsiveProductsCategory) {
        filtered1 = selectedProductCat.subcategory.filter(data => data.id == cat.parentId);
        if (filtered1.length != 0) {
          this.activeSubCat = filtered1[0].id;
          this.currentResponsiveCats = filtered1.map(a => Object.assign({}, a));;
          break;
        } else {
          let filtered2;
          for (let selectedProductSubCat of selectedProductCat.subcategory) {
            if (selectedProductSubCat.subcategory) {
              filtered2 = selectedProductSubCat.subcategory.filter(data => data.id == cat.parentId);
              if (filtered2.length != 0) {
                this.activeSubCat = filtered2[0].id;
                this.currentResponsiveCats = filtered2.map(a => Object.assign({}, a));;
                break;
              }
            }
          }
        }
      }
    } else {
      this.activeSubCat = filtered[0].id;
      if (filtered[0].level == 2) {
        this.currentResponsiveCats = this.responsiveProductsCategory.map(a => Object.assign({}, a));
      } else {
        this.currentResponsiveCats = filtered;
      }
    }
  }
}
