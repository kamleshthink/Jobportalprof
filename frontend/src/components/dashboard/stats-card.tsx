import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  linkText?: string;
  linkHref?: string;
  bgColor?: string;
  iconBgColor?: string;
  iconColor?: string;
}

const StatsCard = ({
  title,
  value,
  icon,
  linkText = "View all",
  linkHref = "#",
  bgColor = "bg-white",
  iconBgColor = "bg-primary-100",
  iconColor = "text-primary-600"
}: StatsCardProps) => {
  return (
    <Card className={`overflow-hidden ${bgColor}`}>
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md p-3 ${iconBgColor}`}>
              <div className={`text-xl ${iconColor}`}>{icon}</div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{value}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <a href={linkHref} className="font-medium text-primary hover:text-primary-500">
              {linkText}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
