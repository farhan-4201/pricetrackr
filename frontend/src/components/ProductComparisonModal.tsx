import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitCompare, ShoppingCart, ExternalLink, X } from "lucide-react";
import { ScrapedProduct } from "@/lib/api";
import { ProductComparisonTable } from "./ProductComparisonTable";
import { toast } from "sonner";

interface ProductComparisonModalProps {
  products: ScrapedProduct[];
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  products,
  trigger,
  isOpen: controlledIsOpen,
  onOpenChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : isOpen;
  const setOpen = isControlled ? onOpenChange || (() => {}) : setIsOpen;

  const handleProductRemove = (product: ScrapedProduct) => {
    // This will be handled by the parent component through context
    console.log('Removing product from comparison:', product.name);
  };

  const handleBulkPurchase = () => {
    // Open all product URLs in new tabs
    products.forEach(product => {
      if (product.url) {
        window.open(product.url, '_blank');
      }
    });
    toast.success(`Opened ${products.length} product pages`);
  };

  const defaultTrigger = (
    <Button
      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
      size="sm"
      disabled={products.length < 2}
    >
      <GitCompare className="w-4 h-4 mr-2" />
      Compare {products.length > 0 ? `(${products.length})` : ''} Products
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!isControlled && products.length >= 2 && (
        <DialogTrigger asChild>
          {defaultTrigger}
        </DialogTrigger>
      )}

      <DialogContent className={`max-w-7xl max-h-[90vh] overflow-hidden ${className}`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center space-x-3">
            <GitCompare className="w-6 h-6 text-cyan-400" />
            <span className="text-xl font-semibold text-white">Product Comparison</span>
            <Badge variant="outline" className="border-cyan-400 text-cyan-400">
              {products.length} products
            </Badge>
          </DialogTitle>

          <div className="flex items-center space-x-2">
            {products.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkPurchase}
                className="border-green-400 text-green-400 hover:bg-green-400/10"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Open All Stores
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <ProductComparisonTable
            products={products}
            onRemoveProduct={handleProductRemove}
          />
        </div>

        {/* Summary Footer */}
        {products.length >= 2 && (
          <div className="mt-6 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <div className="text-sm text-slate-400">Best Price</div>
                <div className="text-lg font-bold text-green-400">
                  Rs. {Math.min(...products.map(p => p.price || Infinity).filter(p => p !== Infinity)).toLocaleString()}
                </div>
              </div>

              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <div className="text-sm text-slate-400">Average Price</div>
                <div className="text-lg font-bold text-cyan-400">
                  Rs. {Math.round(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length).toLocaleString()}
                </div>
              </div>

              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <div className="text-sm text-slate-400">Price Range</div>
                <div className="text-lg font-bold text-yellow-400">
                  Rs. {Math.round(Math.min(...products.map(p => p.price || Infinity).filter(p => p !== Infinity))).toLocaleString()} - Rs. {Math.round(Math.max(...products.map(p => p.price || 0))).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-slate-500">
              Compare prices, ratings, and features across different marketplaces to make the best purchase decision.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
