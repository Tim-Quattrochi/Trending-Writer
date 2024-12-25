import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function Privacy() {
  return (
    <section className="container mx-auto p-8">
      <Card className="w-full overflow-scroll">
        <CardHeader>
          <CardTitle className="text-center text-3xl md:text-4xl">
            Privacy Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          Trending Writer Privacy Policy Effective Date: 12-23-2024
          This Privacy Policy explains how Trending Writer
          (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
          collects, uses, shares, and protects your information when
          you use our website, mobile applications, and other services
          (collectively, the &quot;Services&quot;). 1. Information We
          Collect Personal Information: We may collect personal
          information directly from you, such as: Account Information:
          Name, email address, username, password. Contact
          Information: Phone number. Payment Information: Credit card
          information (if applicable). Content Information: Content
          you create, upload, or submit (e.g., articles, blog posts,
          images). Usage Data: We may automatically collect
          information about your use of the Services, such as: Device
          Information: IP address, device type, operating system,
          browser type. Usage Information: Pages visited, features
          used, time spent on the Services. Location Information:
          General location information (e.g., city, country). 2. How
          We Use Your Information We may use your information for
          various purposes, including: Providing and Improving the
          Services: To operate and maintain the Services, provide
          customer support, and personalize your experience.
          Communicating with You: To send you notifications, updates,
          and marketing communications. Analyzing Usage: To analyze
          how you use the Services and improve our offerings.
          Protecting Our Rights: To detect, prevent, and address
          fraud, security, or technical issues. Complying with Legal
          Obligations: To comply with applicable laws and regulations.
          3. Sharing Your Information We may share your information
          with: Service Providers: Third-party vendors who assist us
          in providing the Services (e.g., hosting providers, payment
          processors, analytics providers). We have contracts with
          these service providers requiring them to protect your
          information.   Business Partners: With your consent, we may
          share your information with business partners for marketing
          or other purposes. Legal Authorities: We may disclose your
          information to legal authorities if required by law or legal
          process. Affiliates and Subsidiaries: We may share your
          information within our corporate family for internal
          business purposes. Business Transfers: In the event of a
          merger, acquisition, or sale of all or a portion of our
          assets, your information may be transferred as part of the
          transaction.   4. Your Choices   Access and Correction: You
          may access and update your account information by logging
          into your account settings. Marketing Communications: You
          may opt out of receiving marketing communications by
          following the unsubscribe instructions included in our
          emails. Cookies: You may disable cookies in your browser
          settings, but this may affect your ability to use certain
          features of the Services. 5. Data Retention We will retain
          your information for as long as necessary to provide the
          Services and as required by applicable law. 6. Security We
          take reasonable measures to protect your information from
          unauthorized access, use, or disclosure. However, no method
          of transmission over the Internet or electronic storage is
          completely secure.   7. Children&apos;s Privacy Our Services
          are not intended for children under the age of 13. We do not
          knowingly collect personal information from children under
          13.   8. Changes to this Privacy Policy We may update this
          Privacy Policy from time to time. We will notify you of any
          material changes by posting the updated policy on our
          website or through other appropriate means.   9. Contact Us
          If you have any questions about this Privacy Policy, please
          contact us at: timq82@gmail.com. Specific Considerations for
          Facebook Compliance: Facebook Login: If you offer login via
          Facebook, you must have a clear and easily accessible
          Privacy Policy. This policy must explain: What data you
          collect from Facebook. How you use this data. That your use
          of the data will comply with the Facebook Platform Policy.
          Data Minimization: Only request data you truly need.
          Transparency: Be upfront about how you use data. Data
          Deletion: If a user disconnects from your app on Facebook or
          requests deletion of their data, you must delete their data
          unless you have a legal obligation to retain it. Provide an
          easy way for users to request data deletion. API
          <CardFooter className="text-sm py-4">
            Usage: If you use any Facebook APIs, adhere to their
            developer policies. Off-Facebook Activity: If you receive
            information from Facebook about user activity off of
            Facebook (if and when that data is shared), you must be
            transparent about its collection and use.
          </CardFooter>
        </CardContent>
      </Card>
    </section>
  );
}
