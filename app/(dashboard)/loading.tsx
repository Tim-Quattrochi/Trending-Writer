import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

//loading skeleton for dashboard table

export default function Loading() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-8 w-48" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-64" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-4 w-8" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-32" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function MyComponent() {
  const [trends, setTrends] = useState<TrendItem[]>([]); // Sample state for trends
  const [generatingArticle, setGeneratingArticle] = useState<
    string | null
  >(null);
  const toast = useToast();

  const handleGenerateArticle = async (trend: TrendItem) => {
    setGeneratingArticle(trend.id);
    try {
      const response = await fetch("/api/generate-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trend),
      });

      if (!response.ok) {
        throw new Error("Failed to generate article");
      }

      const data = await response.json();
      // Here you would typically update your state or trigger a refresh
      toast({
        title: "Article generated successfully",
        description: "The AI-generated article is now available.",
      });
    } catch (error) {
      console.error("Error generating article:", error);
      toast({
        title: "Error generating article",
        description:
          "There was a problem generating the article. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingArticle(null);
    }
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Trend Name</th>
          <th>Generate Article</th> {/* Added header cell */}
          {/* ... other header cells */}
        </tr>
      </thead>
      <tbody>
        {trends.map((trend) => (
          <tr key={trend.id}>
            <td>{trend.id}</td> {/* Example: Displaying trend ID */}
            <TableCell>
              <Button
                onClick={() => handleGenerateArticle(trend)}
                disabled={generatingArticle === trend.id}
              >
                {generatingArticle === trend.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Article"
                )}
              </Button>
            </TableCell>
            {/* ... other table cells */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Placeholder for TableCell component.  Replace with your actual component.
const TableCell = ({ children }: { children: any }) => (
  <td>{children}</td>
);

export default MyComponent;
