
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link 
          to="/" 
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>
        
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: June 1, 2023</p>
        </div>
        
        <div className="prose prose-lg prose-stone dark:prose-invert max-w-none">
          <section className="mb-8">
            <p>
              At GigHubify, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </section>

          <section className="mb-8">
            <h2>Collection of Your Information</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect via the Website includes:
            </p>
            
            <h3>Personal Data</h3>
            <p>
              Personally identifiable information, such as your name, email address, telephone number, and demographic information that you voluntarily give to us when you register with the Website or when you choose to participate in various activities related to the Website. You are under no obligation to provide us with personal information of any kind, however your refusal to do so may prevent you from using certain features of the Website.
            </p>
            
            <h3>Derivative Data</h3>
            <p>
              Information our servers automatically collect when you access the Website, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Website.
            </p>
            
            <h3>Financial Data</h3>
            <p>
              Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, exchange, or request information about our services from the Website.
            </p>
          </section>

          <section className="mb-8">
            <h2>Use of Your Information</h2>
            <p>
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Website to:
            </p>
            <ul>
              <li>Create and manage your account.</li>
              <li>Process your transactions.</li>
              <li>Email you regarding your account or order.</li>
              <li>Send you administrative communications, such as security or support and maintenance advisories.</li>
              <li>Respond to your inquiries and provide customer service.</li>
              <li>Send you newsletters, promotions, and other marketing content.</li>
              <li>Monitor and analyze usage and trends to improve your experience with the Website.</li>
              <li>Notify you of updates to the Website.</li>
              <li>Perform other business activities as needed.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>Disclosure of Your Information</h2>
            <p>
              We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
            </p>
            
            <h3>By Law or to Protect Rights</h3>
            <p>
              If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
            </p>
            
            <h3>Third-Party Service Providers</h3>
            <p>
              We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.
            </p>
            
            <h3>Marketing Communications</h3>
            <p>
              With your consent, or with an opportunity for you to withdraw consent, we may share your information with third parties for marketing purposes.
            </p>
            
            <h3>Business Transfers</h3>
            <p>
              If we reorganize or sell all or a portion of our assets, undergo a merger, or are acquired by another entity, we may transfer your information to the successor entity.
            </p>
          </section>

          <section className="mb-8">
            <h2>Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>
          </section>
          
          <section className="mb-8">
            <h2>Your Rights</h2>
            <h3>Account Information</h3>
            <p>
              You may at any time review or change the information in your account or terminate your account by:
            </p>
            <ul>
              <li>Logging into your account settings and updating your account</li>
              <li>Contacting us using the contact information provided below</li>
            </ul>
            
            <p>
              Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, some information may be retained in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our Terms of Use and/or comply with legal requirements.
            </p>
          </section>
          
          <section className="mb-8">
            <h2>Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at:
            </p>
            
            <address>
              GigHubify<br />
              123 Video Editing Street<br />
              Los Angeles, CA 90001<br />
              Email: privacy@gighubify.com<br />
              Phone: +1 (123) 456-7890
            </address>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
