import React, { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Progress } from '../../components/ui/progress';
import { migrateUserProfileImages, migrateServiceImages } from '../../lib/utils/migrateStorageImages';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../lib/hooks/useAuth';
import { UserRole } from '../../lib/models/user.model';

interface MigrationResult {
  success: number;
  failed: number;
  total: number;
}

enum MigrationStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

const MigrateImagesPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [userMigrationStatus, setUserMigrationStatus] = useState<MigrationStatus>(MigrationStatus.IDLE);
  const [serviceMigrationStatus, setServiceMigrationStatus] = useState<MigrationStatus>(MigrationStatus.IDLE);
  const [userResult, setUserResult] = useState<MigrationResult | null>(null);
  const [serviceResult, setServiceResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate progress
  const getUserProgress = () => {
    if (!userResult) return 0;
    return Math.round(((userResult.success + userResult.failed) / userResult.total) * 100);
  };

  const getServiceProgress = () => {
    if (!serviceResult) return 0;
    return Math.round(((serviceResult.success + serviceResult.failed) / serviceResult.total) * 100);
  };

  // Migration handlers
  const handleMigrateUserImages = async () => {
    try {
      setError(null);
      setUserMigrationStatus(MigrationStatus.RUNNING);
      const result = await migrateUserProfileImages();
      setUserResult(result);
      setUserMigrationStatus(MigrationStatus.COMPLETED);
    } catch (err) {
      setError(`User migration failed: ${err instanceof Error ? err.message : String(err)}`);
      setUserMigrationStatus(MigrationStatus.FAILED);
    }
  };

  const handleMigrateServiceImages = async () => {
    try {
      setError(null);
      setServiceMigrationStatus(MigrationStatus.RUNNING);
      const result = await migrateServiceImages();
      setServiceResult(result);
      setServiceMigrationStatus(MigrationStatus.COMPLETED);
    } catch (err) {
      setError(`Service migration failed: ${err instanceof Error ? err.message : String(err)}`);
      setServiceMigrationStatus(MigrationStatus.FAILED);
    }
  };

  const handleMigrateAll = async () => {
    await handleMigrateUserImages();
    await handleMigrateServiceImages();
  };

  // Check if user is admin
  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </Layout>
    );
  }

  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <Layout>
        <div className="container py-8">
          <Alert variant="destructive">
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to access this page. This page is restricted to administrators.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Image Migration Utility</h1>
        <p className="mb-6">
          This utility converts Firebase Storage URLs to base64 encoded images stored directly in Firestore.
          This helps avoid CORS issues and simplifies the application architecture.
        </p>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Profile Images</CardTitle>
              <CardDescription>Migrate all user profile images from Firebase Storage to base64</CardDescription>
            </CardHeader>
            <CardContent>
              {userMigrationStatus !== MigrationStatus.IDLE && (
                <div className="mb-4">
                  <Progress value={getUserProgress()} className="h-2 mb-2" />
                  <p className="text-sm text-gray-500">
                    Status: {userMigrationStatus === MigrationStatus.RUNNING ? 'Running' : userMigrationStatus}
                  </p>
                  {userResult && (
                    <div className="mt-2 text-sm">
                      <p>Success: {userResult.success}</p>
                      <p>Failed: {userResult.failed}</p>
                      <p>Total: {userResult.total}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleMigrateUserImages}
                disabled={userMigrationStatus === MigrationStatus.RUNNING}
                className="w-full"
              >
                {userMigrationStatus === MigrationStatus.RUNNING
                  ? 'Migrating...'
                  : userMigrationStatus === MigrationStatus.COMPLETED
                  ? 'Run Again'
                  : 'Start Migration'}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Images</CardTitle>
              <CardDescription>Migrate all service images from Firebase Storage to base64</CardDescription>
            </CardHeader>
            <CardContent>
              {serviceMigrationStatus !== MigrationStatus.IDLE && (
                <div className="mb-4">
                  <Progress value={getServiceProgress()} className="h-2 mb-2" />
                  <p className="text-sm text-gray-500">
                    Status: {serviceMigrationStatus === MigrationStatus.RUNNING ? 'Running' : serviceMigrationStatus}
                  </p>
                  {serviceResult && (
                    <div className="mt-2 text-sm">
                      <p>Success: {serviceResult.success}</p>
                      <p>Failed: {serviceResult.failed}</p>
                      <p>Total: {serviceResult.total}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleMigrateServiceImages}
                disabled={serviceMigrationStatus === MigrationStatus.RUNNING}
                className="w-full"
              >
                {serviceMigrationStatus === MigrationStatus.RUNNING
                  ? 'Migrating...'
                  : serviceMigrationStatus === MigrationStatus.COMPLETED
                  ? 'Run Again'
                  : 'Start Migration'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Migrate All Images</CardTitle>
              <CardDescription>Migrate both user profile and service images in sequence</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                onClick={handleMigrateAll}
                disabled={userMigrationStatus === MigrationStatus.RUNNING || serviceMigrationStatus === MigrationStatus.RUNNING}
                className="w-full"
              >
                Start Complete Migration
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MigrateImagesPage; 