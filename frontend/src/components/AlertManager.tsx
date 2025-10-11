import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Bell, BellOff, Target } from "lucide-react";

interface Alert {
  _id?: string;
  type: 'target_price' | 'percentage_drop';
  value: number;
  isActive: boolean;
  triggeredAt?: string;
}

interface AlertManagerProps {
  productId: string;
  productName: string;
  currentPrice: number;
  alerts: Alert[];
  onCreateAlert: (alert: Omit<Alert, '_id'>) => void;
  onUpdateAlert: (alertId: string, updates: Partial<Alert>) => void;
  onDeleteAlert: (alertId: string) => void;
  className?: string;
}

export const AlertManager = ({
  productId,
  productName,
  currentPrice,
  alerts,
  onCreateAlert,
  onUpdateAlert,
  onDeleteAlert,
  className
}: AlertManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlertType, setNewAlertType] = useState<'target_price' | 'percentage_drop'>('target_price');
  const [newAlertValue, setNewAlertValue] = useState('');
  const [newAlertActive, setNewAlertActive] = useState(true);

  const handleCreateAlert = () => {
    if (!newAlertValue) return;

    const alert: Omit<Alert, '_id'> = {
      type: newAlertType,
      value: parseFloat(newAlertValue),
      isActive: newAlertActive
    };

    onCreateAlert(alert);
    setNewAlertValue('');
    setIsCreateDialogOpen(false);
  };

  const getAlertLabel = (alert: Alert) => {
    if (alert.type === 'target_price') {
      return `Target Price: $${alert.value.toFixed(2)}`;
    } else {
      return `Drop Alert: ${alert.value}% drop`;
    }
  };

  const getAlertStatus = (alert: Alert) => {
    if (!alert.isActive) {
      return { label: 'Triggered', color: 'bg-green-500' };
    }

    const isTriggered = alert.type === 'target_price'
      ? currentPrice <= alert.value
      : false; // Percentage drop would need historical data

    return isTriggered
      ? { label: 'Triggered', color: 'bg-green-500' }
      : { label: 'Active', color: 'bg-blue-500' };
  };

  return (
    <div className={`bg-slate-900/50 rounded-lg p-6 border border-slate-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Price Alerts</h3>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10">
              <Plus className="w-4 h-4 mr-2" />
              Add Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Create Price Alert for {productName}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-white">Alert Type</Label>
                <Select value={newAlertType} onValueChange={(value: 'target_price' | 'percentage_drop') => setNewAlertType(value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="target_price">Target Price</SelectItem>
                    <SelectItem value="percentage_drop">Percentage Drop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">
                  {newAlertType === 'target_price' ? 'Target Price ($)' : 'Drop Percentage (%)'}
                </Label>
                <Input
                  type="number"
                  value={newAlertValue}
                  onChange={(e) => setNewAlertValue(e.target.value)}
                  placeholder={newAlertType === 'target_price' ? currentPrice.toString() : '10'}
                  className="bg-slate-800 border-slate-700 text-white"
                  min="0"
                  step={newAlertType === 'target_price' ? '0.01' : '0.1'}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={newAlertActive}
                  onCheckedChange={(checked) => setNewAlertActive(checked as boolean)}
                />
                <Label htmlFor="active" className="text-white">Active</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAlert}
                  disabled={!newAlertValue}
                  style={{ background: 'linear-gradient(135deg, #22d3ee, #22c55e)' }}
                >
                  Create Alert
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-sm text-slate-400 mb-4">
        Current Price: <span className="text-cyan-400 font-semibold">${currentPrice.toFixed(2)}</span>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">No alerts set up for this product</p>
          <p className="text-slate-500 text-sm">Create alerts to get notified when prices change</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const status = getAlertStatus(alert);

            return (
              <div
                key={alert._id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-700/50">
                    {alert.isActive ? (
                      <Bell className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <BellOff className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  <div>
                    <p className="text-white font-medium">{getAlertLabel(alert)}</p>
                    <Badge className={`text-white border-none ${status.color}`}>
                      {status.label}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-700"
                    onClick={() => onUpdateAlert(alert._id!, { isActive: !alert.isActive })}
                  >
                    {alert.isActive ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                    onClick={() => onDeleteAlert(alert._id!)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
