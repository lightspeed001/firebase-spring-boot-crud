import * as k8s from '@pulumi/kubernetes';

// Define the Prometheus Deployment using the `@pulumi/kubernetes` package.
const prometheusDeployment = new k8s.apps.v1.Deployment('prometheus-deployment', {
    spec: {
        replicas: 1,
        selector: { matchLabels: { app: 'prometheus' } },
        template: {
            metadata: { labels: { app: 'prometheus' } },
            spec: {
                containers: [{
                    name: 'prometheus',
                    image: 'prom/prometheus:v2.26.0',
                    ports: [{ containerPort: 9090 }],
                    // Configure Prometheus through command-line flags or configuration file here
                }],
            },
        },
    },
});

// Create a Service to expose the Prometheus deployment inside the cluster.
const prometheusService = new k8s.core.v1.Service('prometheus-service', {
    spec: {
        selector: { app: 'prometheus' },
        ports: [{ port: 9090, targetPort: 9090 }],
    },
});

// Deploy Grafana and configure it to use the Prometheus service as a data source.
// Please note you might want to use a more secure approach for setting up
// the admin password in a real-world scenario.
const grafanaDeployment = new k8s.apps.v1.Deployment('grafana-deployment', {
    spec: {
        replicas: 1,
        selector: { matchLabels: { app: 'grafana' } },
        template: {
            metadata: { labels: { app: 'grafana' } },
            spec: {
                containers: [{
                    name: 'grafana',
                    image: 'grafana/grafana:7.5.4',
                    ports: [{ containerPort: 3000 }],
                    env: [
                        { name: 'GF_SECURITY_ADMIN_PASSWORD', value: 'admin' },
                        // Configure additional environment variables if needed
                    ],
                    // Consider using a ConfigMap or Secret for the Grafana configuration
                }],
            },
        },
    },
});

// Create a Service to expose Grafana.
const grafanaService = new k8s.core.v1.Service('grafana-service', {
    spec: {
        selector: { app: 'grafana' },
        type: 'LoadBalancer', // Change to 'ClusterIP' if you do not want Grafana exposed externally.
        ports: [{ port: 3000, targetPort: 3000 }],
    },
});

// Export the Grafana load balancer's IP or hostname to access Grafana UI.
export const grafanaExternalUrl = grafanaService.status.loadBalancer.ingress[0].hostname || grafanaService.status.loadBalancer.ingress[0].ip;
