import ReviewCarousel from "@/components/ReviewCarousel";
import { ReservationData } from "../types/reservation";
import { useCheckout } from "../hooks/useCheckout";

export const PaymentSection = ({
  reservation,
}: {
  reservation: ReservationData;
}) => {
  const { selectedMethod, setSelectedMethod } = useCheckout();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2">決済方法</h2>

      <select
        value={selectedMethod}
        onChange={(e) => setSelectedMethod(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      >
        <option value="">選択してください</option>
        <option value="card">クレジットカード</option>
        <option value="paypal">PayPal</option>
      </select>

      <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg">
        決済に進む
      </button>

      <ReviewCarousel />
    </div>
  );
};
