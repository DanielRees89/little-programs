import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card } from '@/Components/UI';
import UpdateProfileInformation from './Partials/UpdateProfileInformation';
import UpdatePassword from './Partials/UpdatePassword';
import DeleteAccount from './Partials/DeleteAccount';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AppLayout title="Profile">
            <Head title="Profile" />

            <div className="max-w-3xl space-y-6">
                {/* Profile Information */}
                <Card>
                    <Card.Header>
                        <Card.Title>Profile Information</Card.Title>
                        <Card.Description>
                            Update your name and email address.
                        </Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <UpdateProfileInformation
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </Card.Content>
                </Card>

                {/* Update Password */}
                <Card>
                    <Card.Header>
                        <Card.Title>Update Password</Card.Title>
                        <Card.Description>
                            Use a long, random password to stay secure.
                        </Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <UpdatePassword />
                    </Card.Content>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200">
                    <Card.Header>
                        <Card.Title className="text-red-600">Danger Zone</Card.Title>
                        <Card.Description>
                            Permanently delete your account and all your data.
                        </Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <DeleteAccount />
                    </Card.Content>
                </Card>
            </div>
        </AppLayout>
    );
}
